import { beforeEach, describe, expect, it, vi } from "vitest";

describe("simulation repository", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns an empty data envelope when no assessment ids are provided", async () => {
    const repository = require("../src/repositories/simulation.repository");
    const result = await repository.getSimulationsByAssessmentIds([]);

    expect(result).toEqual({
      data: [],
      error: null,
    });
  });

  it("queries only the supplied assessment ids in newest-first order", async () => {
    const order = vi.fn().mockResolvedValue({
      data: [{ id: "simulation-1" }],
      error: null,
    });
    const inFilter = vi.fn(() => ({ order }));
    const select = vi.fn(() => ({ in: inFilter }));
    const from = vi.fn(() => ({ select }));

    const supabase = require("../src/config/supabase");
    vi.spyOn(supabase, "from").mockImplementation(from);

    const repository = await import("../src/repositories/simulation.repository");
    const result = await repository.getSimulationsByAssessmentIds([
      "assessment-1",
      "assessment-2",
    ]);

    expect(from).toHaveBeenCalledWith("simulations");
    expect(inFilter).toHaveBeenCalledWith("assessment_id", [
      "assessment-1",
      "assessment-2",
    ]);
    expect(order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result.data).toHaveLength(1);
  });
});
