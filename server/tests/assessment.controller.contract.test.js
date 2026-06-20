import { beforeEach, describe, expect, it, vi } from "vitest";
const assessmentService = require("../src/services/assessment.service");
const controller = require("../src/controllers/assessment.controller");

describe("assessment controller contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the existing success envelope for assessment creation", async () => {
    const payload = {
      assessment: { id: "a1" },
      analysis: { stabilityScore: 55 },
      priorities: { priorities: [] },
      roadmap: { roadmap: [] },
    };
    vi.spyOn(assessmentService, "createAssessment").mockResolvedValue(payload);

    const req = {
      body: { situation: "I need help with rent and food." },
      dbUser: { id: "user-1" },
    };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
    };

    await controller.createAssessment(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: payload,
    });
  });
});
