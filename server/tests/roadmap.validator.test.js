import { describe, expect, it, vi } from "vitest";

const {
  validateRoadmapPatch,
} = require("../src/validators/roadmap.validator");

function createResponse() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  };
}

describe("validateRoadmapPatch", () => {
  it("rejects an invalid roadmap status", () => {
    const req = {
      body: {
        status: "DONE",
      },
    };
    const res = createResponse();
    const next = vi.fn();

    validateRoadmapPatch(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "status is invalid",
    });
    expect(next).not.toHaveBeenCalled();
  });
});
