"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CircleCheckBig, CircleDashed, CircleOff, Play } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAssessmentWorkspace } from "@/hooks/use-assessment-workspace";
import { notify } from "@/lib/feedback";
import { updateRoadmapTask } from "@/services/roadmap-service";
import { createReassessment } from "@/services/reassessment-service";
import type { RoadmapItem } from "@/types/domain";

const STATUS_OPTIONS: Array<{
  value: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  label: string;
}> = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "BLOCKED", label: "Blocked" },
];

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

function toDateInputValue(value?: string | null) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
}

function deriveStatus(item: RoadmapItem) {
  return item.status ?? "NOT_STARTED";
}

function statusCopy(status: ReturnType<typeof deriveStatus>) {
  if (status === "COMPLETED") {
    return {
      icon: CircleCheckBig,
      label: "Completed",
      classes: "bg-[#eaf7f1] text-[#2e7a58]",
    };
  }

  if (status === "IN_PROGRESS") {
    return {
      icon: Play,
      label: "In Progress",
      classes: "bg-[#eef4ff] text-[#173b72]",
    };
  }

  if (status === "BLOCKED") {
    return {
      icon: CircleOff,
      label: "Blocked",
      classes: "bg-[#fdebe8] text-[#bf4a34]",
    };
  }

  return {
    icon: CircleDashed,
    label: "Not Started",
    classes: "bg-[#f2f4f8] text-[#62728f]",
  };
}

function buildOptimisticRoadmap(
  roadmap: RoadmapItem[],
  roadmapId: string,
  patch: {
    status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
    dueAt?: string | null;
    userNote?: string | null;
    outcome?: string | null;
  },
) {
  return roadmap.map((item) => {
    if (item.id !== roadmapId) {
      return item;
    }

    const nextItem: RoadmapItem = { ...item };

    if (patch.status !== undefined) {
      nextItem.status = patch.status;

      if (patch.status === "IN_PROGRESS" && !nextItem.started_at) {
        nextItem.started_at = new Date().toISOString();
      }

      if (patch.status === "COMPLETED") {
        nextItem.completed_at = new Date().toISOString();
      } else {
        nextItem.completed_at = null;
      }
    }

    if (patch.dueAt !== undefined) {
      nextItem.due_at = patch.dueAt;
    }

    if (patch.userNote !== undefined) {
      nextItem.user_note = patch.userNote;
    }

    if (patch.outcome !== undefined) {
      nextItem.outcome = patch.outcome;
    }

    return nextItem;
  });
}

export function InteractiveRoadmap({
  roadmap,
  onRoadmapChange,
}: {
  roadmap: RoadmapItem[];
  onRoadmapChange: (roadmap: RoadmapItem[]) => void;
}) {
  const { selectedCaseId, setWorkspace, workspace } = useAssessmentWorkspace();
  const [localRoadmap, setLocalRoadmap] = useState(roadmap);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftOutcomes, setDraftOutcomes] = useState<Record<string, string>>({});
  const [draftDueDates, setDraftDueDates] = useState<Record<string, string>>({});

  useEffect(() => {
    setLocalRoadmap(roadmap);
  }, [roadmap]);

  const progress = useMemo(() => {
    const activeTasks = localRoadmap.filter((item) => deriveStatus(item) !== "BLOCKED");
    const completedTasks = activeTasks.filter(
      (item) => deriveStatus(item) === "COMPLETED",
    );

    if (!activeTasks.length) {
      return 0;
    }

    return Math.round((completedTasks.length / activeTasks.length) * 100);
  }, [localRoadmap]);

  async function applyUpdate(
    roadmapId: string,
    patch: Parameters<typeof buildOptimisticRoadmap>[2],
    successMessage: string,
  ) {
    const previousRoadmap = localRoadmap;
    const optimisticRoadmap = buildOptimisticRoadmap(
      previousRoadmap,
      roadmapId,
      patch,
    );

    setPendingId(roadmapId);
    setLocalRoadmap(optimisticRoadmap);
    onRoadmapChange(optimisticRoadmap);

    try {
      const response = await updateRoadmapTask(roadmapId, patch);
      const syncedRoadmap = optimisticRoadmap.map((item) =>
        item.id === roadmapId ? { ...item, ...response.data } : item,
      );

      setLocalRoadmap(syncedRoadmap);
      onRoadmapChange(syncedRoadmap);
      notify.success(successMessage);

      if (
        patch.status === "COMPLETED" &&
        selectedCaseId &&
        workspace
      ) {
        try {
          const completedTask = syncedRoadmap.find((item) => item.id === roadmapId);
          const reassessment = await createReassessment(selectedCaseId, {
            whatChanged: `Completed roadmap step: ${completedTask?.task || "A case task"}.\nOutcome: ${patch.outcome || patch.userNote || "Marked complete by the user."}`,
            userNote: patch.outcome || patch.userNote || completedTask?.task || "Task completed",
          });
          const nextPriorities = Array.isArray(reassessment.data.priorities)
            ? reassessment.data.priorities
            : reassessment.data.priorities.priorities;
          const nextRoadmap = Array.isArray(reassessment.data.roadmap)
            ? reassessment.data.roadmap
            : reassessment.data.roadmap.roadmap;

          setWorkspace(
            {
              ...workspace,
              assessment: reassessment.data.assessment,
              analysis: reassessment.data.analysis,
              priorities: nextPriorities,
              roadmap: nextRoadmap,
              currentCase: reassessment.data.case ?? workspace.currentCase,
              comparison: reassessment.data.comparison,
            },
            { selectedCaseId },
          );
          notify.success("The case was reevaluated after that completed step.");
        } catch (reassessmentError) {
          notify.info(
            reassessmentError instanceof Error
              ? reassessmentError.message
              : "The task was saved, but the case could not be reevaluated yet.",
          );
        }
      }
    } catch (error) {
      setLocalRoadmap(previousRoadmap);
      onRoadmapChange(previousRoadmap);
      notify.error(
        error instanceof Error
          ? error.message
          : "We couldn't save that roadmap update.",
      );
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[0.34fr_1fr]">
        <div className="rounded-[20px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8eaef5]">
            Progress
          </p>
          <p className="mt-3 font-heading text-[3rem] font-bold leading-none text-[#173b72]">
            {progress}%
          </p>
          <p className="mt-3 text-sm leading-7 text-[#62728f]">
            Completed active tasks divided by all active tasks. Blocked tasks
            stay visible, but they do not count as complete.
          </p>
        </div>

        <div className="rounded-[20px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <h3 className="font-heading text-[1.8rem] font-bold text-[#173b72]">
            Keep your plan current
          </h3>
          <p className="mt-3 text-[15px] leading-8 text-[#62728f]">
            Update task status as you make progress, set due dates, and record
            private notes or outcomes so the rest of your workspace stays in
            sync.
          </p>
        </div>
      </section>

      <section className="space-y-5">
        {localRoadmap.map((item, index) => {
          const status = deriveStatus(item);
          const statusMeta = statusCopy(status);
          const StatusIcon = statusMeta.icon;
          const itemId = item.id ?? `${item.timeline}-${item.task}-${index}`;
          const isPending = pendingId === item.id;
          const noteValue = draftNotes[itemId] ?? item.user_note ?? "";
          const outcomeValue = draftOutcomes[itemId] ?? item.outcome ?? "";
          const dueDateValue = draftDueDates[itemId] ?? toDateInputValue(item.due_at);

          return (
            <article
              key={`${item.id ?? item.timeline}-${index}`}
              className="rounded-[20px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[13px] font-semibold text-[#173b72]">
                      {index + 1}
                    </div>
                    {index < localRoadmap.length - 1 ? (
                      <div className="mt-2 h-full min-h-16 w-px bg-[#dbe3f1]" />
                    ) : null}
                  </div>

                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8aa3]">
                      {item.timeline}
                    </p>
                    <h3 className="mt-2 font-heading text-[1.5rem] font-bold text-[#173b72]">
                      {item.task}
                    </h3>
                    <div
                      className={`mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.classes}`}
                    >
                      <StatusIcon className="h-4 w-4" />
                      {statusMeta.label}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={!item.id || isPending}
                      onClick={() =>
                        item.id
                          ? void applyUpdate(
                              item.id,
                              { status: option.value },
                              "Roadmap status updated.",
                            )
                          : null
                      }
                      className={
                        status === option.value
                          ? "rounded-full bg-[#173b72] px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                          : "rounded-full bg-[#eef4ff] px-3 py-2 text-xs font-semibold text-[#173b72] disabled:opacity-60"
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-5 xl:grid-cols-3">
                <div className="rounded-[18px] bg-[#f7f9fe] px-4 py-4">
                  <div className="flex items-center gap-2 text-[#173b72]">
                    <CalendarClock className="h-4 w-4" />
                    <p className="text-sm font-semibold">Due date</p>
                  </div>
                  <p className="mt-3 text-sm text-[#62728f]">
                    {formatDate(item.due_at)}
                  </p>
                  <input
                    type="date"
                    value={dueDateValue}
                    disabled={!item.id || isPending}
                    onChange={(event) =>
                      setDraftDueDates((current) => ({
                        ...current,
                        [itemId]: event.target.value,
                      }))
                    }
                    className="mt-4 w-full rounded-[12px] border border-[#d9deea] bg-white px-3 py-2 text-sm text-[#173b72] outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full"
                    disabled={!item.id || isPending}
                    onClick={() =>
                      item.id
                        ? void applyUpdate(
                            item.id,
                            {
                              dueAt: dueDateValue
                                ? new Date(`${dueDateValue}T00:00:00.000Z`).toISOString()
                                : null,
                            },
                            "Due date saved.",
                          )
                        : null
                    }
                  >
                    Save Due Date
                  </Button>
                </div>

                <div className="rounded-[18px] bg-[#f7f9fe] px-4 py-4">
                  <p className="text-sm font-semibold text-[#173b72]">
                    Private note
                  </p>
                  <textarea
                    value={noteValue}
                    disabled={!item.id || isPending}
                    onChange={(event) =>
                      setDraftNotes((current) => ({
                        ...current,
                        [itemId]: event.target.value,
                      }))
                    }
                    className="mt-3 min-h-28 w-full rounded-[14px] border border-[#d9deea] bg-white px-3 py-3 text-sm leading-7 text-[#173b72] outline-none"
                    placeholder="Add context, reminders, or details only you need to see later."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full"
                    disabled={!item.id || isPending}
                    onClick={() =>
                      item.id
                        ? void applyUpdate(
                            item.id,
                            { userNote: noteValue.trim() || null },
                            "Task note saved.",
                          )
                        : null
                    }
                  >
                    Save Note
                  </Button>
                </div>

                <div className="rounded-[18px] bg-[#f7f9fe] px-4 py-4">
                  <p className="text-sm font-semibold text-[#173b72]">
                    Outcome
                  </p>
                  <textarea
                    value={outcomeValue}
                    disabled={!item.id || isPending}
                    onChange={(event) =>
                      setDraftOutcomes((current) => ({
                        ...current,
                        [itemId]: event.target.value,
                      }))
                    }
                    className="mt-3 min-h-28 w-full rounded-[14px] border border-[#d9deea] bg-white px-3 py-3 text-sm leading-7 text-[#173b72] outline-none"
                    placeholder="Record what happened after you completed or attempted this step."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-3 w-full"
                    disabled={!item.id || isPending}
                    onClick={() =>
                      item.id
                        ? void applyUpdate(
                            item.id,
                            { outcome: outcomeValue.trim() || null },
                            "Task outcome saved.",
                          )
                        : null
                    }
                  >
                    Save Outcome
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
