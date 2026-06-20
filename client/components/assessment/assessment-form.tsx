"use client";

import { AlertTriangle, BrainCircuit, CheckCircle2, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  createAssessment,
  screenAssessmentSafety,
  type CreateAssessmentBody,
  type SafetyScreeningResult,
} from "@/services/assessment-service";
import { fetchRecommendedResources } from "@/services/resource-service";
import { ApiError } from "@/lib/api-client";
import { notify } from "@/lib/feedback";
import { useAssessmentWorkspace } from "@/hooks/use-assessment-workspace";
import { frontendFeatures } from "@/lib/features";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { ResourceRecommendation } from "@/types/domain";

const CONCERN_OPTIONS = [
  "Housing or rent pressure",
  "Job loss or reduced income",
  "Food or essential needs",
  "Healthcare or medication access",
  "Personal safety concerns",
  "Caregiving or dependent support",
  "Legal, paperwork, or benefit access",
];

const SINGLE_SELECT_SECTIONS = [
  {
    key: "timePressure",
    label: "How urgent is this situation?",
    options: [
      "Action is needed within 24 hours",
      "Action is needed within 1 to 3 days",
      "Action is needed within 1 to 2 weeks",
      "Action is needed within 3 to 4 weeks",
      "There is more than one month to respond",
    ],
  },
  {
    key: "housingStatus",
    label: "Which housing status fits best right now?",
    options: [
      "Housing is stable",
      "Rent or housing costs are difficult",
      "I am behind on rent or at risk of losing housing",
      "I received an eviction notice or urgent housing warning",
      "I do not have a safe place to stay tonight",
    ],
  },
  {
    key: "incomeStatus",
    label: "Which income situation fits best?",
    options: [
      "Income is stable",
      "Hours or income were reduced",
      "I recently lost income or employment",
      "I am relying on savings or temporary support",
      "I currently have no reliable income",
    ],
  },
  {
    key: "essentialNeedsStatus",
    label: "How are basic needs right now?",
    options: [
      "Food, transport, and utilities are covered",
      "Basic needs are covered for now but tight",
      "Basic needs are under real pressure",
      "I may lose access to essentials very soon",
      "Food or essential daily needs are not covered",
    ],
  },
  {
    key: "healthcareStatus",
    label: "How are healthcare needs right now?",
    options: [
      "Healthcare needs are managed",
      "Care is delayed but not urgent",
      "Medication or treatment is becoming difficult to access",
      "An urgent health issue needs attention soon",
      "A severe medical situation needs immediate help",
    ],
  },
  {
    key: "safetyStatus",
    label: "How would you describe personal safety?",
    options: [
      "No current safety threat",
      "Some concern, but not immediate danger",
      "There is a real safety concern",
      "I feel unsafe or under threat",
      "There is immediate danger right now",
    ],
  },
  {
    key: "supportLevel",
    label: "How much support is available?",
    options: [
      "Strong family, social, or financial support",
      "Some support is available",
      "Support is limited",
      "Very few realistic options are available",
      "I have no reliable support right now",
    ],
  },
] as const;

type IntakeProfile = NonNullable<CreateAssessmentBody["intakeProfile"]>;

const EMPTY_PROFILE: IntakeProfile = {
  primaryConcerns: [],
  timePressure: "",
  housingStatus: "",
  incomeStatus: "",
  essentialNeedsStatus: "",
  healthcareStatus: "",
  safetyStatus: "",
  supportLevel: "",
};

function buildIntakeContextSummary(intakeProfile: IntakeProfile) {
  const lines = [
    intakeProfile.primaryConcerns?.length
      ? `Primary concerns: ${intakeProfile.primaryConcerns.join(", ")}`
      : null,
    intakeProfile.timePressure ? `Time pressure: ${intakeProfile.timePressure}` : null,
    intakeProfile.housingStatus ? `Housing status: ${intakeProfile.housingStatus}` : null,
    intakeProfile.incomeStatus ? `Income status: ${intakeProfile.incomeStatus}` : null,
    intakeProfile.essentialNeedsStatus
      ? `Essential needs: ${intakeProfile.essentialNeedsStatus}`
      : null,
    intakeProfile.healthcareStatus
      ? `Healthcare status: ${intakeProfile.healthcareStatus}`
      : null,
    intakeProfile.safetyStatus ? `Safety status: ${intakeProfile.safetyStatus}` : null,
    intakeProfile.supportLevel ? `Support level: ${intakeProfile.supportLevel}` : null,
  ].filter(Boolean);

  return lines.length ? `\n\nStructured intake context:\n${lines.join("\n")}` : "";
}

export function AssessmentForm() {
  const router = useRouter();
  const { setWorkspace } = useAssessmentWorkspace();
  const [situation, setSituation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [safetyResult, setSafetyResult] = useState<SafetyScreeningResult | null>(null);
  const [intakeProfile, setIntakeProfile] = useState<IntakeProfile>(EMPTY_PROFILE);

  useEffect(() => {
    setConsentAccepted(
      window.localStorage.getItem("civicbridge.ai-consent") === "accepted",
    );
  }, []);

  function updateConcern(option: string) {
    setIntakeProfile((current) => {
      const currentConcerns = current.primaryConcerns ?? [];
      const nextConcerns = currentConcerns.includes(option)
        ? currentConcerns.filter((item) => item !== option)
        : [...currentConcerns, option];

      return {
        ...current,
        primaryConcerns: nextConcerns,
      };
    });
  }

  function updateField(key: keyof IntakeProfile, value: string) {
    setIntakeProfile((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!consentAccepted) {
      notify.error("Please confirm the AI guidance notice before continuing.");
      return;
    }

    const loadingToastId = notify.loading("Opening your case workspace...");
    const intakeContext = buildIntakeContextSummary(intakeProfile);

    setSubmitting(true);
    setError(null);
    setSafetyResult(null);

    try {
      if (frontendFeatures.enableEmergencyScreening) {
        const screening = await screenAssessmentSafety({ situation });
        setSafetyResult(screening.data);

        if (screening.data.isUrgent) {
          notify.error(
            "Urgent safety concerns were detected. Please review the immediate guidance before continuing.",
          );
        }
      }

      const response = await createAssessment({
        situation,
        intakeProfile,
      });
      const nextResult = response.data;

      let recommendedResources: ResourceRecommendation[] = [];

      try {
        const resourcesResult = await fetchRecommendedResources({
          situation: `${situation}${intakeContext}`,
          analysis: {
            housingRisk: nextResult.analysis.housingRisk,
            incomeRisk: nextResult.analysis.incomeRisk,
            healthcareRisk: nextResult.analysis.healthcareRisk,
            overallRisk: nextResult.analysis.overallRisk,
          },
        });
        recommendedResources = resourcesResult.data.resources;
      } catch {
        notify.info(
          "Your case is ready. Resource suggestions will appear as soon as matching finishes.",
        );
      }

      setWorkspace(
        {
          situation,
          assessment: nextResult.assessment,
          analysis: nextResult.analysis,
          priorities: nextResult.priorities.priorities,
          roadmap: nextResult.roadmap.roadmap,
          resources: recommendedResources,
          simulations: [],
          currentCase: nextResult.caseId
            ? {
                id: nextResult.caseId,
                user_id: nextResult.assessment.user_id,
                title: situation.slice(0, 80) || "New case",
                status:
                  nextResult.analysis.overallRisk === "HIGH"
                    ? "URGENT"
                    : nextResult.analysis.overallRisk === "LOW"
                      ? "STABLE"
                      : "ACTIVE",
                main_risk: nextResult.analysis.overallRisk,
                latest_stability_score: nextResult.analysis.stabilityScore,
                current_assessment_id: nextResult.assessment.id,
                last_activity_at: new Date().toISOString(),
              }
            : null,
          resourceInteractions: [],
          resourceInteractionsAvailable: frontendFeatures.enableResourceInteractions,
          comparison: null,
        },
        {
          selectedCaseId: nextResult.caseId ?? null,
        },
      );

      notify.dismiss(loadingToastId);
      notify.success("Your case workspace is ready.");

      if (nextResult.caseId) {
        router.push(`/cases/${nextResult.caseId}`);
      } else {
        router.push("/dashboard");
      }
    } catch (submitError) {
      notify.dismiss(loadingToastId);

      if (submitError instanceof ApiError) {
        const message =
          submitError.status === 500
            ? "We couldn't complete your assessment right now. Please try again in a moment."
            : submitError.message;
        setError(message);
        notify.error(message);
      } else {
        const message = "Unable to submit the assessment right now.";
        setError(message);
        notify.error(message);
      }
    } finally {
      notify.dismiss(loadingToastId);
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="p-6 md:p-7">
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#8eaef5]">
              New Case
            </p>
            <h2 className="mt-3 font-heading text-[2.65rem] font-bold tracking-[-0.05em] text-[#173b72]">
              Describe what is happening
            </h2>
            <p className="mt-3 max-w-2xl text-[15px] leading-8 text-[#62728f]">
              Share the situation in your own words, then answer a few quick questions
              so Civic Bridge AI can score urgency more fairly and build a more useful plan.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              Situation
            </label>
            <Textarea
              value={situation}
              onChange={(event) => setSituation(event.target.value)}
              placeholder="Explain what you're facing, what feels urgent, what is at risk, and what decisions you are trying to make."
              rows={10}
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Please enter at least 10 characters so the system can open a case around your situation.
            </p>
          </div>

          <div className="rounded-2xl border border-[#dbe4f4] bg-[#f7f9fe] px-4 py-4 text-sm text-[#62728f]">
            <p className="font-semibold text-[#173b72]">Before you continue</p>
            <p className="mt-2 leading-7">
              Civic Bridge AI uses AI to interpret the case you submit. The results are
              guidance only and do not replace legal, medical, or mental health professionals.
              If you are facing an emergency, contact local emergency services or a trusted professional right away.
            </p>
            <label className="mt-4 flex items-start gap-3">
              <input
                type="checkbox"
                checked={consentAccepted}
                onChange={(event) => {
                  const checked = event.target.checked;
                  setConsentAccepted(checked);
                  if (checked) {
                    window.localStorage.setItem("civicbridge.ai-consent", "accepted");
                  } else {
                    window.localStorage.removeItem("civicbridge.ai-consent");
                  }
                }}
                className="mt-1 h-4 w-4 rounded border-[#cbd5e1]"
              />
              <span>
                I understand that AI will process this situation and that the results are advisory.
              </span>
            </label>
          </div>

          {safetyResult?.isUrgent ? (
            <div className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-4 text-sm text-danger">
              <p className="font-semibold">{safetyResult.message}</p>
              <p className="mt-2 leading-7">
                {safetyResult.recommendedImmediateAction}
              </p>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
              {error}
            </div>
          ) : null}

          <Button type="submit" disabled={submitting || situation.trim().length < 10}>
            {submitting ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <BrainCircuit className="h-4 w-4" />
            )}
            Start New Case
          </Button>
        </form>
      </Card>

      <Card className="p-6 md:p-7">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#173b72]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-heading text-[1.9rem] font-bold text-[#173b72]">
                Quick Case Signals
              </h3>
              <p className="text-sm text-[#62728f]">
                Select what applies so the assessment is more specific and less guess-based.
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-[#173b72]">Main concern areas</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CONCERN_OPTIONS.map((option) => {
                const active = intakeProfile.primaryConcerns?.includes(option);

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateConcern(option)}
                    className={
                      active
                        ? "rounded-full bg-[#173b72] px-3 py-2 text-sm font-semibold text-white"
                        : "rounded-full border border-[#d9deea] bg-white px-3 py-2 text-sm font-semibold text-[#173b72]"
                    }
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-5">
            {SINGLE_SELECT_SECTIONS.map((section) => (
              <div key={section.key}>
                <p className="text-sm font-semibold text-[#173b72]">{section.label}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {section.options.map((option) => {
                    const active = intakeProfile[section.key] === option;

                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => updateField(section.key, option)}
                        className={
                          active
                            ? "rounded-[16px] border border-[#173b72] bg-[#eef4ff] px-4 py-3 text-left text-sm font-semibold text-[#173b72]"
                            : "rounded-[16px] border border-[#d9deea] bg-white px-4 py-3 text-left text-sm text-[#5f6f8a]"
                        }
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-[#f4ddd8] bg-[#fff5f2] px-4 py-4 text-sm text-[#bf4a34]">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <p className="leading-7">
                These answers help the model weigh both stabilizing and destabilizing evidence.
                They do not replace the full situation description.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
