"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/empty-state";
import { useAssessmentWorkspace } from "@/hooks/use-assessment-workspace";
import { frontendFeatures } from "@/lib/features";
import { fetchReassessments } from "@/services/reassessment-service";
import {
  fetchResourceInteractions,
} from "@/services/resource-interaction-service";
import type { Assessment, ResourceInteraction } from "@/types/domain";

function metricCard(label: string, value: string | number, detail: string) {
  return (
    <div className="rounded-[18px] border border-[#dbe4f4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c8ba4]">
        {label}
      </p>
      <p className="mt-3 font-heading text-[2rem] font-bold text-[#173b72]">
        {value}
      </p>
      <p className="mt-2 text-sm leading-7 text-[#62728f]">{detail}</p>
    </div>
  );
}

export default function ProgressPage() {
  const { selectedCaseId, workspace, workspaceReady } = useAssessmentWorkspace();
  const [reassessments, setReassessments] = useState<Assessment[]>([]);
  const [interactions, setInteractions] = useState<ResourceInteraction[]>([]);

  useEffect(() => {
    if (!selectedCaseId) {
      setReassessments(
        workspace?.assessment.assessment_kind === "REASSESSMENT"
          ? [workspace.assessment]
          : [],
      );
      setInteractions(workspace?.resourceInteractions || []);
      return;
    }

    const activeCaseId = selectedCaseId;
      let cancelled = false;

    async function loadCaseMetrics() {
      try {
        const [reassessmentResult, interactionResult] =
          await Promise.allSettled([
            frontendFeatures.enableReassessment
              ? fetchReassessments(activeCaseId)
              : Promise.resolve({ data: [] }),
            frontendFeatures.enableResourceInteractions
              ? fetchResourceInteractions(activeCaseId)
              : Promise.resolve({ data: [] }),
          ]);

        if (cancelled) {
          return;
        }

        setReassessments(
          reassessmentResult.status === "fulfilled"
            ? reassessmentResult.value.data
            : workspace?.assessment.assessment_kind === "REASSESSMENT"
              ? [workspace.assessment]
              : [],
        );
        setInteractions(
          interactionResult.status === "fulfilled"
            ? interactionResult.value.data
            : workspace?.resourceInteractions || [],
        );
      } catch {
        if (!cancelled) {
          setReassessments(
            workspace?.assessment.assessment_kind === "REASSESSMENT"
              ? [workspace.assessment]
              : [],
          );
          setInteractions(workspace?.resourceInteractions || []);
        }
      }
    }

    void loadCaseMetrics();

    return () => {
      cancelled = true;
    };
  }, [
    selectedCaseId,
    workspace?.assessment,
    workspace?.resourceInteractions,
  ]);

  const roadmapMetrics = useMemo(() => {
    const tasks = workspace?.roadmap || [];

    return {
      total: tasks.length,
      completed: tasks.filter((task) => task.status === "COMPLETED").length,
      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      blocked: tasks.filter((task) => task.status === "BLOCKED").length,
    };
  }, [workspace?.roadmap]);

  if (!workspaceReady) {
    return null;
  }

  if (!workspace) {
    return (
      <EmptyState
        title="No progress data yet"
        message="Start a case first so your score, roadmap completion, saved resources, and simulation history can be tracked."
        action={
          <Link
            href="/assessments/new"
            className="inline-flex rounded-[12px] bg-[#173b72] px-4 py-2.5 font-semibold text-white"
          >
            Start New Case
          </Link>
        }
      />
    );
  }

  const comparison = workspace.comparison;
  const currentScore = workspace.analysis.stabilityScore;
  const currentRisk = workspace.analysis.overallRisk ?? "Not assessed";
  const previousScore = comparison?.previousStabilityScore ?? null;
  const previousRisk = comparison?.previousOverallRisk ?? null;
  const scoreDelta = comparison?.scoreDelta ?? null;

  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
        <h2 className="font-heading text-[30px] font-bold tracking-[-0.04em] text-[#173b72]">
          Case Progress
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-[1.8] text-[#62728f]">
          Review how the active case is evolving across stability, roadmap completion,
          reassessments, and tracked support actions.
        </p>
        {selectedCaseId ? (
          <Link
            href={`/cases/${selectedCaseId}`}
            className="mt-4 inline-flex rounded-[12px] border border-[#d9deea] bg-white px-4 py-2.5 font-semibold text-[#173b72]"
          >
            Back To Case Workspace
          </Link>
        ) : null}
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {metricCard(
          "Current Stability",
          currentScore,
          comparison
            ? `Previous score ${previousScore ?? "--"} and current score ${currentScore}.`
            : "This is the score from the current case snapshot.",
        )}
        {metricCard(
          "Score Change",
          scoreDelta === null ? "Current only" : `${scoreDelta > 0 ? "+" : ""}${scoreDelta}`,
          comparison
            ? comparison.summary
            : "A change value appears after the first reassessment is completed.",
        )}
        {metricCard(
          "Current Risk",
          currentRisk,
          comparison && previousRisk
            ? `Previous overall risk was ${previousRisk}.`
            : "Overall risk will be compared after reassessment data exists.",
        )}
        {metricCard(
          "Reassessments",
          reassessments.length,
          reassessments.length
            ? "Each reassessment preserves a new snapshot for the current case."
            : "No reassessment snapshots have been recorded yet.",
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[18px] border border-[#dbe4f4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <h3 className="font-heading text-[22px] font-bold text-[#173b72]">
            Roadmap Completion
          </h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {metricCard(
              "Completed Tasks",
              roadmapMetrics.completed,
              `${roadmapMetrics.total} total tasks in the current roadmap.`,
            )}
            {metricCard(
              "In Progress",
              roadmapMetrics.inProgress,
              "These tasks are actively underway.",
            )}
            {metricCard(
              "Blocked",
              roadmapMetrics.blocked,
              "Blocked items need follow-up before they can continue.",
            )}
            {metricCard(
              "Saved Resources",
              interactions.length,
              "Tracked support resources linked to this case.",
            )}
          </div>
        </article>

        <article className="rounded-[18px] border border-[#dbe4f4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <h3 className="font-heading text-[22px] font-bold text-[#173b72]">
            Reassessment History
          </h3>

          {reassessments.length ? (
            <div className="mt-5 space-y-4">
              {reassessments.map((assessment, index) => (
                <div
                  key={`${assessment.id}-${index}`}
                  className="rounded-[14px] border border-[#e3e9f3] bg-[#fbfcff] p-4"
                >
                  <p className="font-heading text-[18px] font-bold text-[#173b72]">
                    Snapshot {reassessments.length - index}
                  </p>
                  <p className="mt-3 text-[14px] leading-[1.8] text-[#5f6f8a]">
                    Stability score recorded: {assessment.stability_score}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No reassessment history yet"
              message="As case tasks are completed or the situation changes, updated case snapshots will appear here."
            />
          )}
        </article>
      </section>
    </div>
  );
}
