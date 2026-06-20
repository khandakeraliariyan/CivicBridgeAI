import { beforeEach, describe, expect, it, vi } from "vitest";

describe("roadmap progress service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("sets started_at when a task moves to IN_PROGRESS", async () => {
    process.env.ENABLE_TASK_PROGRESS = "true";

    const roadmapRepository = require("../src/repositories/roadmap.repository");
    const ownershipService = require("../src/services/ownership.service");

    vi.spyOn(roadmapRepository, "isTaskProgressSchemaReady").mockResolvedValue(true);
    vi.spyOn(ownershipService, "verifyRoadmapOwnership").mockResolvedValue({
      id: "roadmap-1",
      assessment_id: "assessment-1",
      status: "NOT_STARTED",
      started_at: null,
      completed_at: null,
    });
    const updateRoadmapTaskSpy = vi
      .spyOn(roadmapRepository, "updateRoadmapTask")
      .mockResolvedValue({
        data: {
          id: "roadmap-1",
          status: "IN_PROGRESS",
        },
        error: null,
      });

    const roadmapProgressService = require("../src/services/roadmap-progress.service");
    const result = await roadmapProgressService.updateRoadmapTask(
      "roadmap-1",
      "user-1",
      { status: "IN_PROGRESS" },
    );

    expect(updateRoadmapTaskSpy).toHaveBeenCalledWith(
      "roadmap-1",
      expect.objectContaining({
        status: "IN_PROGRESS",
        started_at: expect.any(String),
      }),
    );
    expect(result.status).toBe("IN_PROGRESS");
  });

  it("clears completed_at when a completed task is moved back to BLOCKED", async () => {
    process.env.ENABLE_TASK_PROGRESS = "true";

    const roadmapRepository = require("../src/repositories/roadmap.repository");
    const ownershipService = require("../src/services/ownership.service");

    vi.spyOn(roadmapRepository, "isTaskProgressSchemaReady").mockResolvedValue(true);
    vi.spyOn(ownershipService, "verifyRoadmapOwnership").mockResolvedValue({
      id: "roadmap-2",
      assessment_id: "assessment-1",
      status: "COMPLETED",
      started_at: "2026-06-20T00:00:00.000Z",
      completed_at: "2026-06-20T00:00:00.000Z",
    });
    const updateRoadmapTaskSpy = vi
      .spyOn(roadmapRepository, "updateRoadmapTask")
      .mockResolvedValue({
        data: {
          id: "roadmap-2",
          status: "BLOCKED",
          completed_at: null,
        },
        error: null,
      });

    const roadmapProgressService = require("../src/services/roadmap-progress.service");
    const result = await roadmapProgressService.updateRoadmapTask(
      "roadmap-2",
      "user-1",
      { status: "BLOCKED" },
    );

    expect(updateRoadmapTaskSpy).toHaveBeenCalledWith(
      "roadmap-2",
      expect.objectContaining({
        status: "BLOCKED",
        completed_at: null,
      }),
    );
    expect(result.completed_at).toBeNull();
  });
});
