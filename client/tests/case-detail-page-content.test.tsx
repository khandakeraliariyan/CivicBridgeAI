import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AssessmentWorkspace } from "@/providers/assessment-workspace-provider";
import type { CaseWorkspacePayload } from "@/types/domain";

const fetchCaseDetail = vi.fn();
const hydrateCaseWorkspace = vi.fn();
const updateCase = vi.fn();

const workspaceValue: {
  workspace: AssessmentWorkspace | null;
  workspaceReady: boolean;
  selectedCaseId: string | null;
  savedAt: string | null;
  setWorkspace: ReturnType<typeof vi.fn>;
  hydrateCaseWorkspace: (payload: CaseWorkspacePayload) => void;
  updateResources: ReturnType<typeof vi.fn>;
  updateResourceInteractions: ReturnType<typeof vi.fn>;
  updatePriorities: ReturnType<typeof vi.fn>;
  updateRoadmap: ReturnType<typeof vi.fn>;
  appendSimulation: ReturnType<typeof vi.fn>;
  clearWorkspace: ReturnType<typeof vi.fn>;
} = {
  workspace: null,
  workspaceReady: true,
  selectedCaseId: null,
  savedAt: null,
  setWorkspace: vi.fn(),
  hydrateCaseWorkspace,
  updateResources: vi.fn(),
  updateResourceInteractions: vi.fn(),
  updatePriorities: vi.fn(),
  updateRoadmap: vi.fn(),
  appendSimulation: vi.fn(),
  clearWorkspace: vi.fn(),
};

vi.mock("@/lib/features", () => ({
  frontendFeatures: {
    enableCaseHistory: true,
  },
}));

vi.mock("@/services/case-service", () => ({
  fetchCaseDetail,
  updateCase,
}));

vi.mock("@/hooks/use-assessment-workspace", () => ({
  useAssessmentWorkspace: () => workspaceValue,
}));

describe("CaseDetailPageContent", () => {
  beforeEach(() => {
    fetchCaseDetail.mockReset();
    updateCase.mockReset();
    hydrateCaseWorkspace.mockReset();
    workspaceValue.workspace = null;
    workspaceValue.selectedCaseId = null;
    workspaceValue.savedAt = null;
  });

  it("hydrates the shared workspace when a case reopens", async () => {
    fetchCaseDetail.mockResolvedValue({
      data: {
        case: {
          id: "case-1",
          user_id: "user-1",
          title: "Job loss and rent pressure",
          status: "URGENT",
          main_risk: "HIGH",
          last_activity_at: "2026-06-20T00:00:00.000Z",
          created_at: "2026-06-18T00:00:00.000Z",
        },
        latestAssessment: {
          id: "assessment-1",
          user_id: "user-1",
          case_id: "case-1",
          situation_text: "I lost my job and need help.",
          stability_score: 31,
          created_at: "2026-06-18T00:00:00.000Z",
        },
        analysis: {
          stabilityScore: 31,
          housingRisk: "HIGH",
          incomeRisk: "HIGH",
          healthcareRisk: "LOW",
          overallRisk: "HIGH",
          summary: "Housing and income need attention.",
        },
        priorities: [
          {
            title: "Keep housing stable",
            reasoning: "Housing is urgent.",
          },
        ],
        roadmap: [
          {
            timeline: "NOW",
            task: "Contact emergency rent assistance",
          },
        ],
        simulations: [],
        resourceInteractions: [],
        resourceInteractionsAvailable: false,
        comparison: null,
      },
    });

    const { CaseDetailPageContent } = await import(
      "@/components/cases/case-detail-page-content"
    );

    render(<CaseDetailPageContent caseId="case-1" />);

    await waitFor(() => {
      expect(screen.getByText("Housing and income need attention.")).toBeInTheDocument();
    });
    expect(hydrateCaseWorkspace).toHaveBeenCalled();
    expect(
      screen.getByText("Contact emergency rent assistance"),
    ).toBeInTheDocument();
  });

  it("falls back to the saved local workspace when the backend case load fails", async () => {
    fetchCaseDetail.mockRejectedValue(new Error("Service unavailable"));
    workspaceValue.workspace = {
      situation: "Saved workspace",
      assessment: {
        id: "assessment-2",
        user_id: "user-1",
        situation_text: "Saved workspace",
        stability_score: 39,
      },
      analysis: {
        stabilityScore: 39,
        housingRisk: "HIGH",
        incomeRisk: "MEDIUM",
        healthcareRisk: "LOW",
        overallRisk: "HIGH",
        summary: "Saved summary",
      },
      priorities: [],
      roadmap: [],
      resources: [],
      simulations: [],
      currentCase: null,
      resourceInteractions: [],
      resourceInteractionsAvailable: false,
      comparison: null,
    };
    workspaceValue.selectedCaseId = "case-2";
    workspaceValue.savedAt = "2026-06-20T00:00:00.000Z";

    const { CaseDetailPageContent } = await import(
      "@/components/cases/case-detail-page-content"
    );

    render(<CaseDetailPageContent caseId="case-2" />);

    await waitFor(() => {
      expect(
        screen.getByText(/saved local workspace cache/i),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Saved summary")).toBeInTheDocument();

    workspaceValue.workspace = null;
    workspaceValue.selectedCaseId = null;
    workspaceValue.savedAt = null;
  });
});
