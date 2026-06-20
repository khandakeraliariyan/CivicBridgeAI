import { beforeEach, describe, expect, it, vi } from "vitest";
const assessmentRepository = require("../src/repositories/assessment.repository");
const { verifyAssessmentOwnership } = require("../src/services/ownership.service");

describe("verifyAssessmentOwnership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws not found when the assessment is missing", async () => {
    vi.spyOn(assessmentRepository, "getAssessmentById").mockResolvedValue({
      data: null,
      error: null,
    });

    await expect(
      verifyAssessmentOwnership("assessment-1", "user-1"),
    ).rejects.toMatchObject({
      message: "Assessment not found",
      statusCode: 404,
    });
  });

  it("throws forbidden when the assessment belongs to another user", async () => {
    vi.spyOn(assessmentRepository, "getAssessmentById").mockResolvedValue({
      data: { id: "assessment-1", user_id: "user-2" },
      error: null,
    });

    await expect(
      verifyAssessmentOwnership("assessment-1", "user-1"),
    ).rejects.toMatchObject({
      message: "Access denied",
      statusCode: 403,
    });
  });
});
