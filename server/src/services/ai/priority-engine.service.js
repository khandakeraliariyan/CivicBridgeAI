const { buildPriorityPrompt, } = require("../../prompts/priority.prompt");
const { runPrompt } = require("../../utils/ai-executor");
const { normalizePriorities } = require("../../utils/ai-normalizers");

const generatePriorities = async (situation, riskAnalysis) => {
    return runPrompt({
        prompt: buildPriorityPrompt(
            situation,
            riskAnalysis
        ),
        validator: (payload) => typeof payload === "object" && payload !== null,
        normalizer: normalizePriorities,
    });
};

module.exports = {
    generatePriorities,
};
