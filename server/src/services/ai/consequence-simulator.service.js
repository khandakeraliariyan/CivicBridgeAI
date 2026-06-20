const { buildSimulationPrompt, } = require("../../prompts/simulation.prompt");
const { runPrompt } = require("../../utils/ai-executor");
const { normalizeSimulation } = require("../../utils/ai-normalizers");

const simulateDecision = async (situation, analysis, decision) => {
    return runPrompt({
        prompt: buildSimulationPrompt(
            situation,
            analysis,
            decision
        ),
        validator: (payload) => typeof payload === "object" && payload !== null,
        normalizer: normalizeSimulation,
    });
};

module.exports = {
    simulateDecision,
};
