import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const fetchDashboardSummary = vi.fn();

vi.mock("@/lib/features", () => ({
  frontendFeatures: {
    enableDailyActions: true,
  },
}));

vi.mock("@/services/dashboard-service", () => ({
  fetchDashboardSummary,
}));

vi.mock("@/hooks/use-assessment-workspace", () => ({
  useAssessmentWorkspace: () => ({
    selectedCaseId: "case-1",
    workspaceReady: true,
  }),
}));

describe("DailyActionsPanel", () => {
  it("renders deterministic next-task ordering from the backend summary", async () => {
    fetchDashboardSummary.mockResolvedValueOnce({
      data: {
        currentCase: {
          id: "case-1",
          user_id: "user-1",
          title: "Housing crisis",
          status: "URGENT",
          last_activity_at: "2026-06-20T00:00:00.000Z",
        },
        highestRisk: "HIGH",
        latestStabilityScore: 29,
        tasksDueToday: [],
        overdueTasks: [
          {
            id: "task-1",
            timeline: "NOW",
            task: "Submit rent relief request",
          },
        ],
        nextRecommendedTasks: [
          {
            id: "task-1",
            timeline: "NOW",
            task: "Submit rent relief request",
          },
          {
            id: "task-2",
            timeline: "TODAY",
            task: "Call legal aid",
          },
        ],
        blockedTasks: [],
        completedTaskCount: 1,
        totalTaskCount: 4,
        lastActivity: "2026-06-20T00:00:00.000Z",
      },
    });

    const { DailyActionsPanel } = await import(
      "@/components/dashboard/daily-actions-panel"
    );

    render(<DailyActionsPanel />);

    await waitFor(() => {
      expect(screen.getByText("Daily Action Focus")).toBeInTheDocument();
    });
    expect(fetchDashboardSummary).toHaveBeenCalledWith("case-1");
    expect(screen.getByText("Submit rent relief request")).toBeInTheDocument();
    expect(screen.getByText("Call legal aid")).toBeInTheDocument();
  });
});
