import { beforeEach, describe, expect, it, vi } from "vitest";

describe("dashboard service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("orders daily action tasks deterministically", async () => {
    process.env.ENABLE_CASE_HISTORY = "true";
    process.env.ENABLE_TASK_PROGRESS = "true";
    process.env.ENABLE_DAILY_ACTIONS = "true";

    const caseRepository = require("../src/repositories/case.repository");
    const roadmapRepository = require("../src/repositories/roadmap.repository");

    vi.spyOn(caseRepository, "isCaseHistorySchemaReady").mockResolvedValue(true);
    vi.spyOn(roadmapRepository, "isTaskProgressSchemaReady").mockResolvedValue(true);
    vi.spyOn(caseRepository, "getCurrentCaseForUser").mockResolvedValue({
      data: {
        id: "case-1",
        current_assessment_id: "assessment-1",
        main_risk: "HIGH",
        latest_stability_score: 29,
        last_activity_at: "2026-06-20T00:00:00.000Z",
      },
      error: null,
    });
    vi.spyOn(roadmapRepository, "getRoadmapByAssessmentId").mockResolvedValue({
      data: [
        {
          id: "task-1",
          task: "Overdue in progress",
          status: "IN_PROGRESS",
          due_at: "2026-06-18T00:00:00.000Z",
          sort_order: 2,
        },
        {
          id: "task-2",
          task: "Overdue not started",
          status: "NOT_STARTED",
          due_at: "2026-06-19T00:00:00.000Z",
          sort_order: 1,
        },
        {
          id: "task-3",
          task: "Due today",
          status: "NOT_STARTED",
          due_at: "2026-06-20T00:00:00.000Z",
          sort_order: 3,
        },
        {
          id: "task-4",
          task: "In progress without due date",
          status: "IN_PROGRESS",
          due_at: null,
          sort_order: 4,
        },
        {
          id: "task-5",
          task: "Blocked task",
          status: "BLOCKED",
          due_at: null,
          sort_order: 5,
        },
      ],
      error: null,
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-20T12:00:00.000Z"));

    const dashboardService = require("../src/services/dashboard.service");
    const result = await dashboardService.getDashboardSummary("user-1");

    expect(result.nextRecommendedTasks.map((task) => task.task)).toEqual([
      "Overdue in progress",
      "Overdue not started",
      "Due today",
      "In progress without due date",
    ]);
    expect(result.blockedTasks.map((task) => task.task)).toEqual(["Blocked task"]);
    expect(result.totalTaskCount).toBe(4);

    vi.useRealTimers();
  });
});
