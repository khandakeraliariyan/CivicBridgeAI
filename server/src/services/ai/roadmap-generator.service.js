const { buildRoadmapPrompt, } = require("../../prompts/roadmap.prompt");
const { runPrompt } = require("../../utils/ai-executor");
const { normalizeRoadmap } = require("../../utils/ai-normalizers");

const generateRoadmap = async (situation, analysis, priorities) => {
    return runPrompt({
        prompt: buildRoadmapPrompt(
            situation,
            analysis,
            priorities
        ),
        validator: (payload) => typeof payload === "object" && payload !== null,
        normalizer: normalizeRoadmap,
    });
};

module.exports = {
    generateRoadmap,
};
