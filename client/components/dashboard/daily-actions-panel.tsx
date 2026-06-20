"use client";

import { useEffect, useState } from "react";
import { Clock3, TriangleAlert } from "lucide-react";

import { ErrorState } from "@/components/ui/error-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useAssessmentWorkspace } from "@/hooks/use-assessment-workspace";
import { frontendFeatures } from "@/lib/features";
import { fetchDashboardSummary, type DashboardSummary } from "@/services/dashboard-service";

function formatDate(value?: string | null) {
  if (!value) {
    return "No date set";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function DailyActionsPanel() {
  const { selectedCaseId, workspaceReady } = useAssessmentWorkspace();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(frontendFeatures.enableDailyActions);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    if (!frontendFeatures.enableDailyActions || !workspaceReady) {
      return;
    }

    let cancelled = false;

    async function loadSummary() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetchDashboardSummary(selectedCaseId);

        if (!cancelled) {
          setSummary(response.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "We couldn't load today's action summary.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [refreshNonce, selectedCaseId, workspaceReady]);

  if (!frontendFeatures.enableDailyActions) {
    return null;
  }

  if (!workspaceReady || loading) {
    return <LoadingState title="Loading today's action plan" />;
  }

  if (error) {
    return (
      <ErrorState
        title="We couldn't load today's action plan"
        message={error}
        actionLabel="Try Again"
        onAction={() => setRefreshNonce((current) => current + 1)}
      />
    );
  }

  if (!summary?.currentCase) {
    return null;
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[300px_1fr]">
      <article className="rounded-[18px] border border-[#dbe4f4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8eaef5]">
          Today
        </p>
        <h2 className="mt-3 font-heading text-[1.8rem] font-bold text-[#173b72]">
          Daily Action Focus
        </h2>
        <p className="mt-3 text-sm leading-7 text-[#62728f]">
          {summary.currentCase.title}
        </p>

        <div className="mt-6 grid gap-3">
          <div className="rounded-[16px] bg-[#f7f9fe] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7c879e]">
              Highest Risk
            </p>
            <p className="mt-2 text-sm font-semibold text-[#173b72]">
              {summary.highestRisk ?? "To be reviewed"}
            </p>
          </div>
          <div className="rounded-[16px] bg-[#f7f9fe] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7c879e]">
              Stability Score
            </p>
            <p className="mt-2 text-sm font-semibold text-[#173b72]">
              {summary.latestStabilityScore ?? "--"}
            </p>
          </div>
          <div className="rounded-[16px] bg-[#f7f9fe] px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7c879e]">
              Completion
            </p>
            <p className="mt-2 text-sm font-semibold text-[#173b72]">
              {summary.completedTaskCount} of {summary.totalTaskCount} active tasks
            </p>
          </div>
        </div>
      </article>

      <article className="rounded-[18px] border border-[#dbe4f4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-[1.8rem] font-bold text-[#173b72]">
              Next Recommended Tasks
            </h2>
            <p className="mt-2 text-sm text-[#62728f]">
              Ordered from most urgent to least urgent using stored task data only.
            </p>
          </div>
          {summary.overdueTasks.length ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fdebe8] px-3 py-1 text-xs font-semibold text-[#bf4a34]">
              <TriangleAlert className="h-4 w-4" />
              {summary.overdueTasks.length} overdue
            </div>
          ) : null}
        </div>

        <div className="mt-5 space-y-3">
          {summary.nextRecommendedTasks.map((task, index) => (
            <div
              key={`${task.id ?? task.task}-${index}`}
              className="rounded-[16px] border border-[#e6ebf4] bg-[#fbfcff] px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7c879e]">
                    {task.timeline}
                  </p>
                  <p className="mt-2 font-semibold text-[#173b72]">
                    {task.task}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#62728f]">
                  <Clock3 className="h-4 w-4 text-[#173b72]" />
                  {formatDate(task.due_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}
