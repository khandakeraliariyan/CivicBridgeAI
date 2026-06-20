import { describe, expect, it, vi } from "vitest";

const validateAssessment = require("../src/validators/assessment.validator");

describe("assessment validator", () => {
  it("rejects a missing situation", () => {
    const req = { body: {} };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
    };
    const next = vi.fn();

    validateAssessment(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Situation must contain at least 10 characters",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows a valid situation", () => {
    const req = { body: { situation: "I need help now." } };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
    };
    const next = vi.fn();

    validateAssessment(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
