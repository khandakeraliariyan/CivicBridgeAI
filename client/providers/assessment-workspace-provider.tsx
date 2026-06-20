"use client";

import { createContext, useEffect, useMemo, useState } from "react";

import type {
  Assessment,
  CaseRecord,
  CaseWorkspacePayload,
  Priority,
  ReassessmentComparison,
  ResourceInteraction,
  ResourceRecommendation,
  RiskAnalysis,
  RoadmapItem,
  Simulation,
} from "@/types/domain";

const STORAGE_KEY = "civicbridge.latest-assessment-workspace";
const WORKSPACE_VERSION = 2;

export interface AssessmentWorkspace {
  situation: string;
  assessment: Assessment;
  analysis: RiskAnalysis;
  priorities: Priority[];
  roadmap: RoadmapItem[];
  resources: ResourceRecommendation[];
  simulations: Simulation[];
  currentCase: CaseRecord | null;
  resourceInteractions: ResourceInteraction[];
  resourceInteractionsAvailable: boolean;
  comparison: ReassessmentComparison | null;
}

interface PersistedAssessmentWorkspace {
  workspaceVersion: number;
  selectedCaseId: string | null;
  savedAt: string;
  workspace: AssessmentWorkspace;
}

function isValidCaseId(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value !== "undefined";
}

function sanitizeWorkspace(
  value: AssessmentWorkspace | null,
): AssessmentWorkspace | null {
  if (!value) {
    return null;
  }

  const currentCase = value.currentCase && isValidCaseId(value.currentCase.id)
    ? value.currentCase
    : null;

  return {
    ...value,
    currentCase,
  };
}

interface AssessmentWorkspaceContextValue {
  workspace: AssessmentWorkspace | null;
  workspaceReady: boolean;
  selectedCaseId: string | null;
  savedAt: string | null;
  setWorkspace: (
    workspace: AssessmentWorkspace,
    options?: { selectedCaseId?: string | null },
  ) => void;
  hydrateCaseWorkspace: (payload: CaseWorkspacePayload) => void;
  updateResources: (resources: ResourceRecommendation[]) => void;
  updateResourceInteractions: (
    interactions: ResourceInteraction[],
    options?: { selectedCaseId?: string | null },
  ) => void;
  updatePriorities: (priorities: Priority[]) => void;
  updateRoadmap: (roadmap: RoadmapItem[]) => void;
  appendSimulation: (simulation: Simulation) => void;
  clearWorkspace: () => void;
}

export const AssessmentWorkspaceContext =
  createContext<AssessmentWorkspaceContextValue | null>(null);

export function AssessmentWorkspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [workspace, setWorkspaceState] = useState<AssessmentWorkspace | null>(
    null,
  );
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as
          | PersistedAssessmentWorkspace
          | AssessmentWorkspace;

        if (
          typeof parsed === "object" &&
          parsed !== null &&
          "workspaceVersion" in parsed &&
          "workspace" in parsed
        ) {
          const persisted = parsed as PersistedAssessmentWorkspace;
          const sanitizedWorkspace = sanitizeWorkspace(persisted.workspace);
          const sanitizedSelectedCaseId = isValidCaseId(persisted.selectedCaseId)
            ? persisted.selectedCaseId
            : sanitizedWorkspace?.currentCase?.id ?? null;

          setWorkspaceState(sanitizedWorkspace);
          setSelectedCaseId(sanitizedSelectedCaseId);
          setSavedAt(persisted.savedAt ?? null);
        } else {
          setWorkspaceState(sanitizeWorkspace(parsed as AssessmentWorkspace));
        }
      }
    } catch {
    } finally {
      setWorkspaceReady(true);
    }
  }, []);

  function persist(
    nextWorkspace: AssessmentWorkspace | null,
    nextSelectedCaseId: string | null,
  ) {
    const sanitizedWorkspace = sanitizeWorkspace(nextWorkspace);
    const sanitizedSelectedCaseId = isValidCaseId(nextSelectedCaseId)
      ? nextSelectedCaseId
      : sanitizedWorkspace?.currentCase?.id ?? null;

    setWorkspaceState(sanitizedWorkspace);
    setSelectedCaseId(sanitizedSelectedCaseId);

    if (sanitizedWorkspace) {
      const nextSavedAt = new Date().toISOString();
      const payload: PersistedAssessmentWorkspace = {
        workspaceVersion: WORKSPACE_VERSION,
        selectedCaseId: sanitizedSelectedCaseId,
        savedAt: nextSavedAt,
        workspace: sanitizedWorkspace,
      };

      setSavedAt(nextSavedAt);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      return;
    }

    setSavedAt(null);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  const value = useMemo<AssessmentWorkspaceContextValue>(
    () => ({
      workspace,
      workspaceReady,
      selectedCaseId,
      savedAt,
      setWorkspace: (nextWorkspace, options) =>
        persist(nextWorkspace, options?.selectedCaseId ?? selectedCaseId),
      hydrateCaseWorkspace: (payload) => {
        const keepCachedResources =
          selectedCaseId === payload.case.id ? workspace?.resources ?? [] : [];

        persist(
          {
            situation: payload.latestAssessment.situation_text,
            assessment: payload.latestAssessment,
            analysis: payload.analysis,
            priorities: payload.priorities,
            roadmap: payload.roadmap,
            resources: keepCachedResources,
            simulations: payload.simulations,
            currentCase: payload.case,
            resourceInteractions: payload.resourceInteractions ?? [],
            resourceInteractionsAvailable:
              payload.resourceInteractionsAvailable ?? false,
            comparison: payload.comparison ?? null,
          },
          payload.case.id,
        );
      },
      updateResources: (resources) => {
        if (!workspace) {
          return;
        }

        persist({
          ...workspace,
          resources,
        }, selectedCaseId);
      },
      updateResourceInteractions: (resourceInteractions, options) => {
        if (!workspace) {
          return;
        }

        persist(
          {
            ...workspace,
            resourceInteractions,
          },
          options?.selectedCaseId ?? selectedCaseId,
        );
      },
      updatePriorities: (priorities) => {
        if (!workspace) {
          return;
        }

        persist({
          ...workspace,
          priorities,
        }, selectedCaseId);
      },
      updateRoadmap: (roadmap) => {
        if (!workspace) {
          return;
        }

        persist({
          ...workspace,
          roadmap,
        }, selectedCaseId);
      },
      appendSimulation: (simulation) => {
        if (!workspace) {
          return;
        }

        persist({
          ...workspace,
          simulations: [simulation, ...workspace.simulations],
        }, selectedCaseId);
      },
      clearWorkspace: () => persist(null, null),
    }),
    [savedAt, selectedCaseId, workspace, workspaceReady],
  );

  return (
    <AssessmentWorkspaceContext.Provider value={value}>
      {children}
    </AssessmentWorkspaceContext.Provider>
  );
}
