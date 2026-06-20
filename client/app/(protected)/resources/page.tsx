"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock, FileText, LoaderCircle, PhoneCall } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { useAssessmentWorkspace } from "@/hooks/use-assessment-workspace";
import { frontendFeatures } from "@/lib/features";
import { notify } from "@/lib/feedback";
import {
  createResourceInteraction,
  estimateEligibility,
  fetchResourceInteractions,
  generateApplicationAssistance,
  updateResourceInteraction,
} from "@/services/resource-interaction-service";
import type {
  ApplicationAssistance,
  EligibilityGuidance,
  ResourceInteraction,
  ResourceRecommendation,
} from "@/types/domain";

export default function ResourcesPage() {
  const {
    selectedCaseId,
    updateResourceInteractions,
    workspace,
    workspaceReady,
  } =
    useAssessmentWorkspace();
  const [interactions, setInteractions] = useState<ResourceInteraction[]>(
    workspace?.resourceInteractions ?? [],
  );
  const [eligibility, setEligibility] = useState<Record<string, EligibilityGuidance>>({});
  const [assistance, setAssistance] = useState<Record<string, ApplicationAssistance>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [draftFollowUps, setDraftFollowUps] = useState<Record<string, string>>({});
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftReferences, setDraftReferences] = useState<Record<string, string>>({});

  useEffect(() => {
    setInteractions(workspace?.resourceInteractions ?? []);
  }, [workspace?.resourceInteractions]);

  useEffect(() => {
    if (!selectedCaseId || !frontendFeatures.enableResourceInteractions) {
      setInteractions([]);
      return;
    }

    const activeCaseId = selectedCaseId;
    let cancelled = false;

    async function loadInteractions() {
      try {
        const response = await fetchResourceInteractions(activeCaseId);
        if (!cancelled) {
          setInteractions(response.data);
          updateResourceInteractions(response.data, {
            selectedCaseId: activeCaseId,
          });
        }
      } catch {
        if (!cancelled) {
          setInteractions(workspace?.resourceInteractions ?? []);
        }
      }
    }

    void loadInteractions();

    return () => {
      cancelled = true;
    };
  }, [
    selectedCaseId,
    updateResourceInteractions,
    workspace?.resourceInteractions,
  ]);

  if (!workspaceReady) {
    return null;
  }

  if (!workspace) {
    return (
      <EmptyState
        title="No resource recommendations yet"
        message="Start a case first so we can match support options to your situation."
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

  const interactionByResourceId = new Map(
    interactions.map((interaction) => [interaction.resource_id, interaction]),
  );
  const trackedResources = interactions
    .map((interaction) => {
      const resource = interaction.resource;

      if (!resource) {
        return null;
      }

      return {
        resourceId: interaction.resource_id ?? resource.id ?? null,
        name: resource.name || resource.title || "Tracked resource",
        reason: "This support option has already been saved to your case.",
        priority: interaction.status || "SAVED",
        category: resource.category ?? null,
        contact: resource.contact_info ?? null,
        eligibility: null,
      } satisfies ResourceRecommendation;
    })
    .filter(Boolean) as ResourceRecommendation[];
  const visibleResources = workspace.resources.length
    ? workspace.resources
    : trackedResources;

  if (!visibleResources.length) {
    return (
      <EmptyState
        title="No matching resources available yet"
        message="We don't have any saved recommendations for this case yet. Once support options are matched, they will appear here."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
        <h2 className="font-heading text-[30px] font-bold tracking-[-0.04em] text-[#173b72]">
          Case Resources
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-[1.8] text-[#62728f]">
          Review support options that match the active case, save the right ones, and keep outreach details together.
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

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visibleResources.map((resource, index) => (
        (() => {
          const resourceId = resource.resourceId ?? null;
          const interaction = resourceId ? interactionByResourceId.get(resourceId) : null;
          const statusKey = interaction?.id ?? resourceId ?? resource.name ?? `resource-${index}`;
          const followUpValue = draftFollowUps[statusKey] ?? (interaction?.follow_up_at ? new Date(interaction.follow_up_at).toISOString().slice(0, 10) : "");
          const noteValue = draftNotes[statusKey] ?? interaction?.response_note ?? "";
          const referenceValue = draftReferences[statusKey] ?? interaction?.application_reference ?? "";

          return (
            <article
              key={`${resource.name}-${index}`}
              className="rounded-[18px] border border-[#dbe4f4] bg-white p-5 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-heading text-[20px] font-bold text-[#173b72]">
                  {resource.name}
                </h2>
                <span className="rounded-full bg-[#eef4ff] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#173b72]">
                  {resource.priority}
                </span>
              </div>
              <p className="mt-4 text-[14px] leading-[1.85] text-[#5f6f8a]">
                {resource.reason}
              </p>
              {resource.category || resource.contact || resource.eligibility ? (
                <div className="mt-4 space-y-2 text-sm text-[#62728f]">
                  {resource.category ? <p>Category: {resource.category}</p> : null}
                  {resource.contact ? <p>Contact: {resource.contact}</p> : null}
                  {resource.eligibility ? <p>Eligibility: {resource.eligibility}</p> : null}
                </div>
              ) : null}

              {selectedCaseId &&
              resourceId &&
              frontendFeatures.enableResourceInteractions ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-[14px] bg-[#f7f9fe] px-3 py-3 text-sm text-[#62728f]">
                    Status:{" "}
                    <span className="font-semibold text-[#173b72]">
                      {interaction?.status || "Not tracked"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busyKey === `${resourceId}-save`}
                      onClick={async () => {
                        setBusyKey(`${resourceId}-save`);
                        try {
                          const response = await createResourceInteraction(selectedCaseId, {
                            resourceId,
                            status: "SAVED",
                          });
                          setInteractions((current) => {
                            const next = [response.data, ...current.filter((item) => item.id !== response.data.id)];
                            updateResourceInteractions(next, {
                              selectedCaseId,
                            });
                            return next;
                          });
                          notify.success("Resource saved to this case.");
                        } catch (error) {
                          notify.error(
                            error instanceof Error
                              ? error.message
                              : "We couldn't save this resource right now.",
                          );
                        } finally {
                          setBusyKey(null);
                        }
                      }}
                      className="rounded-[12px] bg-[#173b72] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {busyKey === `${resourceId}-save` ? (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      ) : (
                        interaction ? "Saved To Case" : "Save Resource"
                      )}
                    </button>
                    {interaction?.id ? (
                      <>
                        {(
                          [
                            "CONTACTED",
                            "WAITING_FOR_RESPONSE",
                            "COMPLETED",
                            "REJECTED",
                          ] as const
                        ).map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={busyKey === `${interaction.id}-${status}`}
                            onClick={async () => {
                              setBusyKey(`${interaction.id}-${status}`);
                              try {
                                const response = await updateResourceInteraction(
                                  interaction.id!,
                                  { status },
                                );
                                setInteractions((current) => {
                                  const next = current.map((item) =>
                                    item.id === response.data.id ? response.data : item,
                                  );
                                  updateResourceInteractions(next, {
                                    selectedCaseId,
                                  });
                                  return next;
                                });
                                notify.success("Tracked resource updated.");
                              } catch (error) {
                                notify.error(
                                  error instanceof Error
                                    ? error.message
                                    : "We couldn't update this tracked resource right now.",
                                );
                              } finally {
                                setBusyKey(null);
                              }
                            }}
                            className="rounded-[12px] border border-[#d9deea] bg-white px-3 py-2 text-sm font-semibold text-[#173b72] disabled:opacity-60"
                          >
                            {status === "WAITING_FOR_RESPONSE"
                              ? "Waiting"
                              : status.charAt(0) + status.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </>
                    ) : null}
                    {frontendFeatures.enableEligibilityAssistance ? (
                      <button
                        type="button"
                        disabled={busyKey === `${resourceId}-eligibility`}
                        onClick={async () => {
                          setBusyKey(`${resourceId}-eligibility`);
                          try {
                            const response = await estimateEligibility(
                              selectedCaseId,
                              resourceId,
                            );
                            setEligibility((current) => ({
                              ...current,
                              [resourceId]: response.data,
                            }));
                            notify.success("Eligibility guidance is ready.");
                          } catch (error) {
                            notify.error(
                              error instanceof Error
                                ? error.message
                                : "We couldn't estimate eligibility right now.",
                            );
                          } finally {
                            setBusyKey(null);
                          }
                        }}
                        className="rounded-[12px] border border-[#d9deea] bg-white px-3 py-2 text-sm font-semibold text-[#173b72] disabled:opacity-60"
                      >
                        Eligibility
                      </button>
                    ) : null}
                    {frontendFeatures.enableEligibilityAssistance ? (
                      <button
                        type="button"
                        disabled={busyKey === `${resourceId}-assist`}
                        onClick={async () => {
                          setBusyKey(`${resourceId}-assist`);
                          try {
                            const response = await generateApplicationAssistance(
                              selectedCaseId,
                              resourceId,
                            );
                            setAssistance((current) => ({
                              ...current,
                              [resourceId]: response.data,
                            }));
                            notify.success("Application guidance is ready.");
                          } catch (error) {
                            notify.error(
                              error instanceof Error
                                ? error.message
                                : "We couldn't generate application guidance right now.",
                            );
                          } finally {
                            setBusyKey(null);
                          }
                        }}
                        className="rounded-[12px] border border-[#d9deea] bg-white px-3 py-2 text-sm font-semibold text-[#173b72] disabled:opacity-60"
                      >
                        Application Help
                      </button>
                    ) : null}
                  </div>

                  {eligibility[resourceId] ? (
                    <div className="rounded-[14px] bg-[#f7f9fe] px-3 py-3 text-sm text-[#62728f]">
                      <p className="font-semibold text-[#173b72]">
                        Eligibility: {eligibility[resourceId].likelihood}
                      </p>
                      {eligibility[resourceId].reasons.length ? (
                        <div className="mt-3">
                          <p className="font-semibold text-[#173b72]">Why this may fit</p>
                          <ul className="mt-2 space-y-1">
                            {eligibility[resourceId].reasons.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {eligibility[resourceId].missingInformation.length ? (
                        <div className="mt-3">
                          <p className="font-semibold text-[#173b72]">Still helpful to confirm</p>
                          <ul className="mt-2 space-y-1">
                            {eligibility[resourceId].missingInformation.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {eligibility[resourceId].requiredDocuments.length ? (
                        <div className="mt-3">
                          <p className="font-semibold text-[#173b72]">Documents to prepare</p>
                          <ul className="mt-2 space-y-1">
                            {eligibility[resourceId].requiredDocuments.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <p className="mt-3 leading-7">
                        {eligibility[resourceId].disclaimer}
                      </p>
                    </div>
                  ) : null}

                  {assistance[resourceId] ? (
                    <div className="rounded-[14px] bg-[#f7f9fe] px-3 py-3 text-sm text-[#62728f]">
                      <p className="font-semibold text-[#173b72]">Checklist</p>
                      <ul className="mt-2 space-y-1">
                        {assistance[resourceId].checklist.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      {assistance[resourceId].documentChecklist.length ? (
                        <div className="mt-4">
                          <p className="font-semibold text-[#173b72]">Documents to gather</p>
                          <ul className="mt-2 space-y-1">
                            {assistance[resourceId].documentChecklist.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {assistance[resourceId].questionsToAsk.length ? (
                        <div className="mt-4">
                          <p className="font-semibold text-[#173b72]">Questions to ask</p>
                          <ul className="mt-2 space-y-1">
                            {assistance[resourceId].questionsToAsk.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <div className="mt-4 space-y-3">
                        <div className="rounded-[12px] bg-white px-3 py-3">
                          <div className="flex items-center gap-2 font-semibold text-[#173b72]">
                            <FileText className="h-4 w-4" />
                            Request letter
                          </div>
                          <p className="mt-2 whitespace-pre-line leading-7">
                            {assistance[resourceId].requestLetter}
                          </p>
                        </div>
                        <div className="rounded-[12px] bg-white px-3 py-3">
                          <div className="flex items-center gap-2 font-semibold text-[#173b72]">
                            <PhoneCall className="h-4 w-4" />
                            Phone script
                          </div>
                          <p className="mt-2 whitespace-pre-line leading-7">
                            {assistance[resourceId].phoneScript}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 leading-7">{assistance[resourceId].disclaimer}</p>
                    </div>
                  ) : null}

                  {interaction?.id ? (
                    <div className="rounded-[14px] bg-[#f7f9fe] px-3 py-3 text-sm text-[#62728f]">
                      <p className="font-semibold text-[#173b72]">Case follow-up details</p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <label className="mb-2 flex items-center gap-2 font-medium text-[#173b72]">
                            <CalendarClock className="h-4 w-4" />
                            Follow-up date
                          </label>
                          <input
                            type="date"
                            value={followUpValue}
                            onChange={(event) =>
                              setDraftFollowUps((current) => ({
                                ...current,
                                [statusKey]: event.target.value,
                              }))
                            }
                            className="w-full rounded-[12px] border border-[#d9deea] bg-white px-3 py-2 text-sm text-[#173b72] outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block font-medium text-[#173b72]">
                            Application reference
                          </label>
                          <input
                            type="text"
                            value={referenceValue}
                            onChange={(event) =>
                              setDraftReferences((current) => ({
                                ...current,
                                [statusKey]: event.target.value,
                              }))
                            }
                            className="w-full rounded-[12px] border border-[#d9deea] bg-white px-3 py-2 text-sm text-[#173b72] outline-none"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block font-medium text-[#173b72]">
                            Response note
                          </label>
                          <textarea
                            value={noteValue}
                            onChange={(event) =>
                              setDraftNotes((current) => ({
                                ...current,
                                [statusKey]: event.target.value,
                              }))
                            }
                            className="min-h-24 w-full rounded-[12px] border border-[#d9deea] bg-white px-3 py-3 text-sm leading-7 text-[#173b72] outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={busyKey === `${interaction.id}-details`}
                          onClick={async () => {
                            setBusyKey(`${interaction.id}-details`);
                            try {
                              const response = await updateResourceInteraction(
                                interaction.id!,
                                {
                                  followUpAt: followUpValue
                                    ? new Date(`${followUpValue}T00:00:00.000Z`).toISOString()
                                    : null,
                                  responseNote: noteValue.trim() || null,
                                  applicationReference: referenceValue.trim() || null,
                                },
                              );
                              setInteractions((current) => {
                                const next = current.map((item) =>
                                  item.id === response.data.id ? response.data : item,
                                );
                                updateResourceInteractions(next, {
                                  selectedCaseId,
                                });
                                return next;
                              });
                              notify.success("Resource follow-up details saved.");
                            } catch (error) {
                              notify.error(
                                error instanceof Error
                                  ? error.message
                                  : "We couldn't save the follow-up details right now.",
                              );
                            } finally {
                              setBusyKey(null);
                            }
                          }}
                          className="rounded-[12px] bg-[#173b72] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          Save Follow-Up Details
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          );
        })()
        ))}
      </section>
    </div>
  );
}
