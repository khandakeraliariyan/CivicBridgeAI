import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const fetchReassessments = vi.fn();
const fetchResourceInteractions = vi.fn();

vi.mock("@/lib/features", () => ({
  frontendFeatures: {
    enableReassessment: true,
    enableResourceInteractions: true,
  },
}));

vi.mock("@/services/reassessment-service", () => ({
  fetchReassessments,
}));

vi.mock("@/services/resource-interaction-service", () => ({
  fetchResourceInteractions,
}));

vi.mock("@/hooks/use-assessment-workspace", () => ({
  useAssessmentWorkspace: () => ({
    workspaceReady: true,
    selectedCaseId: "case-1",
    workspace: {
      situation: "Need help",
      assessment: {
        id: "assessment-2",
        user_id: "user-1",
        situation_text: "Need help",
        stability_score: 42,
        assessment_kind: "REASSESSMENT",
      },
      analysis: {
        stabilityScore: 42,
        housingRisk: "HIGH",
        incomeRisk: "MEDIUM",
        healthcareRisk: "LOW",
        overallRisk: "MEDIUM",
        summary: "summary",
      },
      priorities: [],
      roadmap: [
        { id: "1", timeline: "NOW", task: "Task 1", status: "COMPLETED" },
        { id: "2", timeline: "TODAY", task: "Task 2", status: "IN_PROGRESS" },
        { id: "3", timeline: "THIS WEEK", task: "Task 3", status: "BLOCKED" },
      ],
      resources: [],
      simulations: [],
      currentCase: null,
      resourceInteractions: [],
      resourceInteractionsAvailable: true,
      comparison: {
        previousStabilityScore: 30,
        currentStabilityScore: 42,
        scoreDelta: 12,
        previousOverallRisk: "HIGH",
        currentOverallRisk: "MEDIUM",
        summary: "Overall stability appears to have improved.",
      },
    },
  }),
}));

describe("ProgressPage", () => {
  it("renders real progress metrics from the current case workspace", async () => {
    fetchReassessments.mockResolvedValueOnce({
      data: [{ id: "assessment-1" }, { id: "assessment-2" }],
    });
    fetchResourceInteractions.mockResolvedValueOnce({
      data: [{ id: "interaction-1", resource_id: "resource-1" }],
    });

    const ProgressPage = (await import("@/app/(protected)/progress/page")).default;

    render(<ProgressPage />);

    await waitFor(() => {
      expect(screen.getByText("Case Progress")).toBeInTheDocument();
    });
    expect(screen.getByText("+12")).toBeInTheDocument();
    expect(screen.getByText("Reassessments")).toBeInTheDocument();
    expect(screen.getByText("Reassessment History")).toBeInTheDocument();
  });
});
