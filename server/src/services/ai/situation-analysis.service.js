const { buildSituationPrompt, } = require("../../prompts/situation-analysis.prompt");
const { runPrompt } = require("../../utils/ai-executor");
const { normalizeSituationAnalysis } = require("../../utils/ai-normalizers");

const analyzeSituation = async (situation) => {
    return runPrompt({
        prompt: buildSituationPrompt(situation),
        validator: (payload) => typeof payload === "object" && payload !== null,
        normalizer: normalizeSituationAnalysis,
    });
};

module.exports = {
    analyzeSituation,
};
