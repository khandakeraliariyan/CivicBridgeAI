const { buildResourcePrompt, } = require("../../prompts/resource-matching.prompt");
const { runPrompt } = require("../../utils/ai-executor");
const { normalizeResourceRecommendations } = require("../../utils/ai-normalizers");

const matchResources = async (situation, analysis, resources) => {
    const normalized = await runPrompt({
        prompt: buildResourcePrompt(
            situation,
            analysis,
            resources
        ),
        validator: (payload) => typeof payload === "object" && payload !== null,
        normalizer: normalizeResourceRecommendations,
    });

    return {
        resources: normalized.resources.map((match) => {
            const sourceResource =
                resources.find((resource) => resource.name === match.title) ||
                resources.find((resource) =>
                    String(resource.name || "")
                        .toLowerCase()
                        .includes(match.title.toLowerCase())
                );

            return {
                resourceId: sourceResource?.id || null,
                name: sourceResource?.name || match.title,
                reason: match.reason,
                priority: match.priority,
                category: sourceResource?.category || null,
                contact: sourceResource?.contact || null,
                eligibility: sourceResource?.eligibility || null,
            };
        }),
    };
};

module.exports = {
    matchResources,
};
