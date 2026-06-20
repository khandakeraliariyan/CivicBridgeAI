"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { Archive, ArrowRight, Save, Sparkles, CheckCircle2 } from "lucide-react";

import { CaseStatusBadge } from "@/components/cases/case-status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAssessmentWorkspace } from "@/hooks/use-assessment-workspace";
import { frontendFeatures } from "@/lib/features";
import { fetchCaseDetail, updateCase } from "@/services/case-service";
import { confirmDialog, notify } from "@/lib/feedback";
import { createReassessment } from "@/services/reassessment-service";
import { createTimelineNote, fetchCaseTimeline } from "@/services/timeline-service";
import type {
  CaseRecord,
  CaseWorkspacePayload,
  ReassessmentComparison,
  TimelineEvent,
} from "@/types/domain";

function formatDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function buildFallbackCaseRecord(caseId: string, title: string): CaseRecord {
  return {
    id: caseId,
    user_id: "",
    title,
    status: "ACTIVE",
    last_activity_at: new Date().toISOString(),
    created_at: null,
    updated_at: null,
  };
}

export function CaseDetailPageContent({ caseId }: { caseId: string }) {
  const {
    hydrateCaseWorkspace,
    savedAt,
    selectedCaseId,
    workspace,
    workspaceReady,
  } = useAssessmentWorkspace();
  const [caseWorkspace, setCaseWorkspace] = useState<CaseWorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineNote, setTimelineNote] = useState("");
  const [reassessmentChange, setReassessmentChange] = useState("");
  const [reassessmentSubmitting, setReassessmentSubmitting] = useState(false);
  const [comparison, setComparison] = useState<ReassessmentComparison | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const [savingCase, setSavingCase] = useState(false);
  const applyWorkspace = useEffectEvent((payload: CaseWorkspacePayload) => {
    hydrateCaseWorkspace(payload);
    setCaseWorkspace(payload);
  });
  const hasValidCaseId = Boolean(caseId && caseId !== "undefined");

  const cachedWorkspace = useMemo(() => {
    if (!workspace || selectedCaseId !== caseId) {
      return null;
    }

    return {
      case:
        workspace.currentCase ||
        buildFallbackCaseRecord(caseId, workspace.situation.slice(0, 80) || "Saved Case"),
      latestAssessment: workspace.assessment,
      analysis: workspace.analysis,
      priorities: workspace.priorities,
      roadmap: workspace.roadmap,
      simulations: workspace.simulations,
      resourceInteractions: workspace.resourceInteractions,
      resourceInteractionsAvailable: workspace.resourceInteractionsAvailable,
      comparison: workspace.comparison,
    } satisfies CaseWorkspacePayload;
  }, [caseId, selectedCaseId, workspace]);

  useEffect(() => {
    if (!frontendFeatures.enableCaseHistory) {
      setLoading(false);
      return;
    }

    if (!hasValidCaseId) {
      setLoading(false);
      setError("The requested case link is invalid.");
      return;
    }

    if (!workspaceReady) {
      return;
    }

    let cancelled = false;
    let finished = false;

    async function loadCase() {
      setLoading(true);
      setError(null);
      setUsingCache(false);

      try {
        const response = await fetchCaseDetail(caseId);

        if (cancelled) {
          return;
        }

        applyWorkspace(response.data);
        finished = true;
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        if (cachedWorkspace) {
          setCaseWorkspace(cachedWorkspace);
          setUsingCache(true);
          finished = true;
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "We couldn't reopen this case right now.",
        );
        finished = true;
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCase();

    return () => {
      cancelled = true;
      if (!finished) {
        setLoading(false);
      }
    };
  }, [caseId, hasValidCaseId, workspaceReady]);

  useEffect(() => {
    if (!frontendFeatures.enableTimeline || !caseWorkspace || !hasValidCaseId) {
      return;
    }

    let cancelled = false;

    async function loadTimeline() {
      try {
        const response = await fetchCaseTimeline(caseId);
        if (!cancelled) {
          setTimeline(response.data.items);
        }
      } catch {
        if (!cancelled) {
          setTimeline([]);
        }
      }
    }

    void loadTimeline();

    return () => {
      cancelled = true;
    };
  }, [caseId, caseWorkspace?.case.id, hasValidCaseId]);

  const visibleResources =
    selectedCaseId === caseId ? workspace?.resources ?? [] : [];

  useEffect(() => {
    setTitleDraft(caseWorkspace?.case.title ?? "");
  }, [caseWorkspace?.case.title]);

  async function applyCasePatch(
    patch: { title?: string; status?: CaseRecord["status"] },
    successMessage: string,
    confirmOptions?: {
      title: string;
      text: string;
      confirmButtonText: string;
    },
  ) {
    if (!caseWorkspace) {
      return;
    }

    if (confirmOptions) {
      const result = await confirmDialog(confirmOptions);
      if (!result.isConfirmed) {
        return;
      }
    }

    setSavingCase(true);

    try {
      const response = await updateCase(caseId, patch);
      const nextPayload = {
        ...caseWorkspace,
        case: response.data,
        analysis: {
          ...caseWorkspace.analysis,
          summary: response.data.summary ?? caseWorkspace.analysis.summary,
        },
      } satisfies CaseWorkspacePayload;

      applyWorkspace(nextPayload);
      notify.success(successMessage);
    } catch (patchError) {
      notify.error(
        patchError instanceof Error
          ? patchError.message
          : "We couldn't update this case right now.",
      );
    } finally {
      setSavingCase(false);
    }
  }

  if (!frontendFeatures.enableCaseHistory) {
    return (
      <EmptyState
        title="Case history is unavailable right now"
        message="We couldn't open this saved case until the secure history service is available again."
      />
    );
  }

  if (loading || !workspaceReady) {
    return <LoadingState title="Opening your case" />;
  }

  if (error || !caseWorkspace) {
    return (
      <ErrorState
        title="We couldn't reopen this case"
        message={error || "The requested case is unavailable."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[24px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8eaef5]">
              Case Workspace
            </p>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center">
              <input
                value={titleDraft}
                onChange={(event) => setTitleDraft(event.target.value)}
                className="w-full max-w-3xl rounded-[16px] border border-[#d9deea] bg-white px-4 py-3 font-heading text-[1.5rem] font-bold tracking-[-0.03em] text-[#173b72] outline-none"
              />
              <Button
                type="button"
                variant="outline"
                disabled={savingCase || !titleDraft.trim() || titleDraft.trim() === caseWorkspace.case.title}
                onClick={() =>
                  void applyCasePatch(
                    { title: titleDraft.trim() },
                    "Case title updated.",
                  )
                }
              >
                <Save className="h-4 w-4" />
                Save Title
              </Button>
            </div>
            <p className="mt-3 max-w-3xl text-[16px] leading-8 text-[#62728f]">
              {caseWorkspace.analysis.summary || "Your current case snapshot is ready to review."}
            </p>
          </div>
          <CaseStatusBadge status={caseWorkspace.case.status} />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-4">
          <div className="rounded-[18px] bg-[#f7f9fe] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c879e]">
              Stability Score
            </p>
            <p className="mt-2 font-heading text-3xl font-bold text-[#173b72]">
              {caseWorkspace.analysis.stabilityScore}
            </p>
          </div>
          <div className="rounded-[18px] bg-[#f7f9fe] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c879e]">
              Main Risk
            </p>
            <p className="mt-2 text-sm font-semibold text-[#173b72]">
              {caseWorkspace.case.main_risk || caseWorkspace.analysis.overallRisk}
            </p>
          </div>
          <div className="rounded-[18px] bg-[#f7f9fe] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c879e]">
              Last Activity
            </p>
            <p className="mt-2 text-sm font-semibold text-[#173b72]">
              {formatDate(caseWorkspace.case.last_activity_at)}
            </p>
          </div>
          <div className="rounded-[18px] bg-[#f7f9fe] px-4 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7c879e]">
              Latest Snapshot
            </p>
            <p className="mt-2 text-sm font-semibold text-[#173b72]">
              {formatDate(caseWorkspace.latestAssessment.created_at)}
            </p>
          </div>
        </div>

        {usingCache ? (
          <div className="mt-6 rounded-[18px] border border-[#d9deea] bg-[#f7f9fe] px-4 py-3 text-sm text-[#62728f]">
            You are viewing your saved local workspace cache from{" "}
            {savedAt ? formatDate(savedAt) : "a previous session"} while the
            secure case history service reconnects.
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-[12px] bg-[#173b72] px-4 py-3 text-sm font-semibold text-white"
          >
            Return to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/roadmap"
            className="inline-flex items-center gap-2 rounded-[12px] border border-[#d9deea] bg-white px-4 py-3 text-sm font-semibold text-[#173b72]"
          >
            Open Roadmap
          </Link>
          <Link
            href="/progress"
            className="inline-flex items-center gap-2 rounded-[12px] border border-[#d9deea] bg-white px-4 py-3 text-sm font-semibold text-[#173b72]"
          >
            Open Progress
          </Link>
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 rounded-[12px] border border-[#d9deea] bg-white px-4 py-3 text-sm font-semibold text-[#173b72]"
          >
            Open Resources
          </Link>
          <Button
            type="button"
            variant="outline"
            disabled={savingCase || caseWorkspace.case.status === "RESOLVED"}
            onClick={() =>
              void applyCasePatch(
                { status: "RESOLVED" },
                "Case marked as resolved.",
                {
                  title: "Mark this case as resolved?",
                  text: "You can reopen it later if the situation changes again.",
                  confirmButtonText: "Mark Resolved",
                },
              )
            }
          >
            <CheckCircle2 className="h-4 w-4" />
            Mark Resolved
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={savingCase || caseWorkspace.case.status === "ARCHIVED"}
            onClick={() =>
              void applyCasePatch(
                { status: "ARCHIVED" },
                "Case archived.",
                {
                  title: "Archive this case?",
                  text: "The case will stay in your history and can still be reopened later.",
                  confirmButtonText: "Archive Case",
                },
              )
            }
          >
            <Archive className="h-4 w-4" />
            Archive Case
          </Button>
          {(caseWorkspace.case.status === "ARCHIVED" ||
            caseWorkspace.case.status === "RESOLVED") ? (
            <Button
              type="button"
              variant="outline"
              disabled={savingCase}
              onClick={() =>
                void applyCasePatch(
                  { status: "ACTIVE" },
                  "Case reopened.",
                )
              }
            >
              Reopen Case
            </Button>
          ) : null}
        </div>
      </section>

      <section>
        <article className="rounded-[24px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <h3 className="font-heading text-[1.8rem] font-bold text-[#173b72]">
            Top Priorities
          </h3>
          <div className="mt-5 space-y-3">
            {caseWorkspace.priorities.map((priority, index) => (
              <div
                key={`${priority.id ?? priority.title ?? "priority"}-${index}`}
                className="rounded-[18px] bg-[#f7f9fe] px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8eaef5]">
                  Priority {index + 1}
                </p>
                <p className="mt-2 font-heading text-xl font-bold text-[#173b72]">
                  {priority.title}
                </p>
                <p className="mt-2 text-[15px] leading-7 text-[#62728f]">
                  {priority.reasoning}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[24px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#173b72]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-[1.8rem] font-bold text-[#173b72]">
                Action Plan
              </h3>
              <p className="text-sm text-[#62728f]">
                The latest roadmap linked to this case
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {caseWorkspace.roadmap.map((item, index) => (
              <div
                key={`${item.id ?? item.task}-${index}`}
                className="rounded-[18px] bg-[#f7f9fe] px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8eaef5]">
                  {item.timeline}
                </p>
                <p className="mt-2 text-[16px] font-semibold text-[#173b72]">
                  {item.task}
                </p>
                {item.due_at ? (
                  <p className="mt-2 text-sm text-[#62728f]">
                    Suggested due date: {formatDate(item.due_at)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[24px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <h3 className="font-heading text-[1.8rem] font-bold text-[#173b72]">
            Support Resources
          </h3>
          <p className="mt-2 text-sm text-[#62728f]">
            Recommended and tracked support options for this case
          </p>

          {visibleResources.length ? (
            <div className="mt-5 space-y-3">
              {visibleResources.slice(0, 3).map((resource, index) => (
                <div
                  key={`${resource.resourceId ?? resource.name}-${index}`}
                  className="rounded-[18px] bg-[#f7f9fe] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#173b72]">{resource.name}</p>
                    <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#173b72]">
                      {resource.priority}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-7 text-[#62728f]">
                    {resource.reason}
                  </p>
                </div>
              ))}
            </div>
          ) : caseWorkspace.resourceInteractions.length ? (
            <div className="mt-5 space-y-3">
              {caseWorkspace.resourceInteractions.slice(0, 3).map((interaction, index) => (
                <div
                  key={`${interaction.id ?? interaction.resource_id}-${index}`}
                  className="rounded-[18px] bg-[#f7f9fe] px-4 py-4"
                >
                  <p className="font-semibold text-[#173b72]">
                    {interaction.resource?.name || interaction.resource?.title || "Tracked resource"}
                  </p>
                  <p className="mt-2 text-sm text-[#62728f]">
                    Current status: {interaction.status || "Saved"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-[18px] bg-[#f7f9fe] px-4 py-4 text-sm text-[#62728f]">
              Support options will appear here after recommendations or tracked resource actions are available for this case.
            </div>
          )}

          <div className="mt-6">
            <Link href="/resources">
              <Button type="button">Open Resource Workspace</Button>
            </Link>
          </div>
        </article>
      </section>

      {frontendFeatures.enableReassessment ? (
        <section className="rounded-[24px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <h3 className="font-heading text-[1.8rem] font-bold text-[#173b72]">
            Update This Case
          </h3>
          <p className="mt-3 text-[15px] leading-8 text-[#62728f]">
            Record what changed so Civic Bridge AI can generate a fresh case
            snapshot and compare it with the previous one.
          </p>
          <textarea
            value={reassessmentChange}
            onChange={(event) => setReassessmentChange(event.target.value)}
            className="mt-5 min-h-32 w-full rounded-[18px] border border-[#d9deea] bg-[#fbfcff] px-4 py-4 text-sm leading-7 text-[#173b72] outline-none"
            placeholder="Describe what changed since the previous assessment."
          />
          <div className="mt-4">
            <Button
              type="button"
              disabled={reassessmentSubmitting || reassessmentChange.trim().length < 10}
              onClick={async () => {
                setReassessmentSubmitting(true);
                try {
                  const response = await createReassessment(caseId, {
                    whatChanged: reassessmentChange,
                  });
                  setComparison(response.data.comparison);
                  const reassessmentPriorities = Array.isArray(response.data.priorities)
                    ? response.data.priorities
                    : response.data.priorities.priorities;
                  const reassessmentRoadmap = Array.isArray(response.data.roadmap)
                    ? response.data.roadmap
                    : response.data.roadmap.roadmap;

                  applyWorkspace({
                    case: caseWorkspace.case,
                    latestAssessment: response.data.assessment,
                    analysis: response.data.analysis,
                    priorities: reassessmentPriorities,
                    roadmap: reassessmentRoadmap,
                    simulations: caseWorkspace.simulations,
                    resourceInteractions: caseWorkspace.resourceInteractions,
                    resourceInteractionsAvailable:
                      caseWorkspace.resourceInteractionsAvailable,
                    comparison: response.data.comparison,
                  });
                  notify.success("Reassessment completed.");
                } catch (submitError) {
                  notify.error(
                    submitError instanceof Error
                      ? submitError.message
                      : "We couldn't complete the reassessment right now.",
                  );
                } finally {
                  setReassessmentSubmitting(false);
                }
              }}
            >
              {reassessmentSubmitting ? "Updating Case..." : "Create Reassessment"}
            </Button>
          </div>

          {comparison ? (
            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <div className="rounded-[18px] bg-[#f7f9fe] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8eaef5]">
                  Stability Delta
                </p>
                <p className="mt-2 font-heading text-2xl font-bold text-[#173b72]">
                  {comparison.previousStabilityScore} to {comparison.currentStabilityScore}
                </p>
                <p className="mt-2 text-sm text-[#62728f]">{comparison.summary}</p>
              </div>
              <div className="rounded-[18px] bg-[#f7f9fe] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8eaef5]">
                  Overall Risk
                </p>
                <p className="mt-2 text-sm font-semibold text-[#173b72]">
                  {comparison.previousOverallRisk} to {comparison.currentOverallRisk}
                </p>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      {frontendFeatures.enableTimeline ? (
        <section className="rounded-[24px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <h3 className="font-heading text-[1.8rem] font-bold text-[#173b72]">
            Case Timeline
          </h3>
          <p className="mt-3 text-[15px] leading-8 text-[#62728f]">
            Review the recent history of this case and add private notes as the
            situation changes.
          </p>
          <div className="mt-5 flex gap-3">
            <textarea
              value={timelineNote}
              onChange={(event) => setTimelineNote(event.target.value)}
              className="min-h-24 flex-1 rounded-[18px] border border-[#d9deea] bg-[#fbfcff] px-4 py-4 text-sm leading-7 text-[#173b72] outline-none"
              placeholder="Add a private timeline note."
            />
            <Button
              type="button"
              disabled={timelineNote.trim().length < 3}
              onClick={async () => {
                try {
                  const response = await createTimelineNote(caseId, timelineNote);
                  setTimeline((current) => [response.data, ...current]);
                  setTimelineNote("");
                  notify.success("Timeline note added.");
                } catch (noteError) {
                  notify.error(
                    noteError instanceof Error
                      ? noteError.message
                      : "We couldn't save the timeline note right now.",
                  );
                }
              }}
            >
              Save Note
            </Button>
          </div>

          <div className="mt-5 space-y-3">
            {timeline.length ? (
              timeline.map((event) => (
                <div
                  key={event.id}
                  className="rounded-[18px] bg-[#f7f9fe] px-4 py-4 text-sm text-[#62728f]"
                >
                  <p className="font-semibold text-[#173b72]">{event.event_type}</p>
                  <p className="mt-2 leading-7">
                    {event.payload && "note" in event.payload
                      ? String(event.payload.note)
                      : "Case activity recorded."}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[18px] bg-[#f7f9fe] px-4 py-4 text-sm text-[#62728f]">
                No timeline events yet.
              </div>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
