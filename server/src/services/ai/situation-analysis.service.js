const model = require("../../config/gemini");

const { buildSituationPrompt, } = require("../../prompts/situation-analysis.prompt");

const analyzeSituation = async (situation) => {
    const prompt =
        buildSituationPrompt(situation);

    const result =
        await model.generateContent(prompt);

    const response =
        result.response.text();

    const cleaned = response
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

    return JSON.parse(cleaned);
};

module.exports = {
    analyzeSituation,
};