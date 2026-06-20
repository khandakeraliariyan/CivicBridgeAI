import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateRoadmapTask = vi.fn();
const createReassessment = vi.fn();
const notify = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};

vi.mock("@/services/roadmap-service", () => ({
  updateRoadmapTask,
}));

vi.mock("@/services/reassessment-service", () => ({
  createReassessment,
}));

vi.mock("@/lib/feedback", () => ({
  notify,
}));

vi.mock("@/hooks/use-assessment-workspace", () => ({
  useAssessmentWorkspace: () => ({
    selectedCaseId: null,
    workspace: null,
    setWorkspace: vi.fn(),
  }),
}));

describe("InteractiveRoadmap", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("optimistically updates task status and keeps the saved result", async () => {
    updateRoadmapTask.mockResolvedValueOnce({
      data: {
        id: "roadmap-1",
        status: "COMPLETED",
      },
    });

    const onRoadmapChange = vi.fn();
    const { InteractiveRoadmap } = await import(
      "@/components/roadmap/interactive-roadmap"
    );

    render(
      <InteractiveRoadmap
        roadmap={[
          {
            id: "roadmap-1",
            timeline: "NOW",
            task: "Contact rent assistance",
            status: "NOT_STARTED",
          },
        ]}
        onRoadmapChange={onRoadmapChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Completed" }));

    await waitFor(() => {
      expect(updateRoadmapTask).toHaveBeenCalledWith("roadmap-1", {
        status: "COMPLETED",
      });
    });
    expect(notify.success).toHaveBeenCalledWith("Roadmap status updated.");
    expect(onRoadmapChange).toHaveBeenCalled();
  });

  it("rolls back the optimistic update when saving fails", async () => {
    updateRoadmapTask.mockRejectedValueOnce(new Error("Save failed"));

    const onRoadmapChange = vi.fn();
    const { InteractiveRoadmap } = await import(
      "@/components/roadmap/interactive-roadmap"
    );

    render(
      <InteractiveRoadmap
        roadmap={[
          {
            id: "roadmap-2",
            timeline: "THIS WEEK",
            task: "Apply for benefits",
            status: "NOT_STARTED",
          },
        ]}
        onRoadmapChange={onRoadmapChange}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "In Progress" })[0]);

    await waitFor(() => {
      expect(notify.error).toHaveBeenCalledWith("Save failed");
    });

    const lastCall =
      onRoadmapChange.mock.calls[onRoadmapChange.mock.calls.length - 1][0];
    expect(lastCall[0].status).toBe("NOT_STARTED");
  });
});
