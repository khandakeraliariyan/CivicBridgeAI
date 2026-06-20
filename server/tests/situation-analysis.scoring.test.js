import { describe, expect, it } from "vitest";

const {
  normalizeSituationAnalysis,
} = require("../src/utils/ai-normalizers");
const {
  buildSituationPrompt,
} = require("../src/prompts/situation-analysis.prompt");

describe("situation analysis scoring calibration", () => {
  it("includes explicit grading criteria in the prompt", () => {
    const prompt = buildSituationPrompt("Need help with rent.");

    expect(prompt).toContain("Housing stability:");
    expect(prompt).toContain("Support and available options:");
    expect(prompt).toContain("Critical-condition guardrails:");
    expect(prompt).toContain('"subScores"');
    expect(prompt).toContain('"stabilizingFactors"');
  });

  it("keeps a balanced but serious pressure case between 35 and 50", () => {
    const result = normalizeSituationAnalysis({
      subScores: {
        housingStability: 38,
        incomeStability: 40,
        essentialNeedsStability: 58,
        healthcareStability: 55,
        personalSafety: 90,
        supportAndOptions: 45,
        timeUrgencyStability: 42,
      },
      stabilityScore: 9,
      housingRisk: "HIGH",
      incomeRisk: "MEDIUM",
      healthcareRisk: "LOW",
      overallRisk: "HIGH",
      destabilizingFactors: [
        "One month behind on rent",
        "Reduced work hours",
        "Dependent sibling",
      ],
      stabilizingFactors: [
        "Still employed part-time",
        "No eviction notice",
        "Food and basic expenses are currently covered",
        "Some savings remain",
        "Active job applications",
      ],
      criticalConditions: [],
      confidence: 0.82,
      scoreExplanation:
        "The situation is serious, but it is not an immediate survival emergency.",
    });

    expect(result.stabilityScore).toBeGreaterThanOrEqual(35);
    expect(result.stabilityScore).toBeLessThanOrEqual(50);
    expect(result.stabilityScore).not.toBeLessThan(15);
  });

  it("keeps an immediate critical crisis in the 0 to 15 range", () => {
    const result = normalizeSituationAnalysis({
      subScores: {
        housingStability: 0,
        incomeStability: 0,
        essentialNeedsStability: 0,
        healthcareStability: 5,
        personalSafety: 10,
        supportAndOptions: 0,
        timeUrgencyStability: 0,
      },
      criticalConditions: [
        "No safe shelter tonight",
        "No food or essential needs",
        "Essential medication unavailable immediately",
      ],
      confidence: 0.94,
      scoreExplanation: "Multiple immediate survival threats are present.",
    });

    expect(result.stabilityScore).toBeGreaterThanOrEqual(0);
    expect(result.stabilityScore).toBeLessThanOrEqual(15);
  });

  it("keeps moderate financial pressure in the 60 to 75 range", () => {
    const result = normalizeSituationAnalysis({
      subScores: {
        housingStability: 82,
        incomeStability: 58,
        essentialNeedsStability: 76,
        healthcareStability: 78,
        personalSafety: 95,
        supportAndOptions: 60,
        timeUrgencyStability: 64,
      },
      stabilizingFactors: [
        "Secure housing",
        "Stable full-time employment",
        "Emergency savings available",
      ],
      destabilizingFactors: ["Debt and rising expenses"],
      confidence: 0.8,
      scoreExplanation: "The situation is pressured but still broadly stable.",
    });

    expect(result.stabilityScore).toBeGreaterThanOrEqual(60);
    expect(result.stabilityScore).toBeLessThanOrEqual(75);
  });

  it("keeps an urgent healthcare crisis in the 15 to 30 range", () => {
    const result = normalizeSituationAnalysis({
      subScores: {
        housingStability: 80,
        incomeStability: 48,
        essentialNeedsStability: 60,
        healthcareStability: 8,
        personalSafety: 72,
        supportAndOptions: 38,
        timeUrgencyStability: 18,
      },
      criticalConditions: ["Severe medical emergency with treatment unavailable"],
      destabilizingFactors: ["Urgent treatment unavailable"],
      stabilizingFactors: ["Stable housing", "Some income remains"],
      confidence: 0.86,
      scoreExplanation: "Healthcare is critically unstable despite some supports elsewhere.",
    });

    expect(result.stabilityScore).toBeGreaterThanOrEqual(15);
    expect(result.stabilityScore).toBeLessThanOrEqual(30);
  });

  it("avoids extreme scoring when information is incomplete", () => {
    const result = normalizeSituationAnalysis({
      subScores: {
        housingStability: 50,
        incomeStability: 50,
        essentialNeedsStability: 50,
        healthcareStability: 50,
        personalSafety: 50,
        supportAndOptions: 50,
        timeUrgencyStability: 50,
      },
      confidence: 0.22,
      scoreExplanation: "Information is incomplete and key risk details are missing.",
      destabilizingFactors: ["Details are vague"],
      stabilizingFactors: [],
      criticalConditions: [],
    });

    expect(result.confidence).toBeLessThan(0.4);
    expect(result.stabilityScore).toBeGreaterThan(20);
    expect(result.stabilityScore).toBeLessThan(80);
    expect(result.scoreExplanation).toContain("missing");
  });
});
