import { beforeEach, describe, expect, it, vi } from "vitest";

describe("eligibility service", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns 503 when the case-history schema is unavailable", async () => {
    const caseRepository = require("../src/repositories/case.repository");
    vi.spyOn(caseRepository, "isCaseHistorySchemaReady").mockResolvedValue(false);

    const service = require("../src/services/eligibility.service");

    await expect(
      service.generateApplicationAssistance("case-1", "resource-1", "user-1"),
    ).rejects.toMatchObject({
      statusCode: 503,
      publicMessage: "Eligibility guidance is not available yet.",
    });
  });

  it("returns 404 when the case is not owned by the user", async () => {
    const caseRepository = require("../src/repositories/case.repository");
    vi.spyOn(caseRepository, "isCaseHistorySchemaReady").mockResolvedValue(true);
    vi.spyOn(caseRepository, "getCaseByIdForUser").mockResolvedValue({
      data: null,
      error: null,
    });

    const service = require("../src/services/eligibility.service");

    await expect(
      service.estimateEligibility("case-1", "resource-1", "user-1"),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Case not found",
    });
  });

});
