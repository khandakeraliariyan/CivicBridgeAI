import { describe, expect, it, vi } from "vitest";

const validateSimulation = require("../src/validators/simulation.validator");

describe("simulation validator", () => {
  it("rejects a missing assessmentId", () => {
    const req = { body: { decision: "Pay rent first" } };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
    };
    const next = vi.fn();

    validateSimulation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "assessmentId required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects a missing decision", () => {
    const req = { body: { assessmentId: "abc" } };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
    };
    const next = vi.fn();

    validateSimulation(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "decision required",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("allows a valid payload", () => {
    const req = { body: { assessmentId: "abc", decision: "Pay rent first" } };
    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
    };
    const next = vi.fn();

    validateSimulation(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
