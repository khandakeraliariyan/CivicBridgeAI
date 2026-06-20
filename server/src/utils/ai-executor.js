const model = require("../config/gemini");
const { createHttpError } = require("./http-error");

function cleanJson(text) {
  return String(text || "")
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

async function runPrompt({
  prompt,
  validator,
  normalizer,
  maxRetries = 1,
  timeoutMs = 45000,
}) {
  let lastError = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    let timeoutId = null;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(
          createHttpError(
            504,
            "AI request timed out",
            "We couldn't finish the AI response in time.",
          ),
        );
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([
        model.generateContent(prompt),
        timeoutPromise,
      ]);
      clearTimeout(timeoutId);

      const cleaned = cleanJson(result.response.text());
      const parsed = JSON.parse(cleaned);

      if (validator && !validator(parsed)) {
        throw createHttpError(
          502,
          "AI response failed validation",
          "We couldn't safely use the AI response.",
        );
      }

      return normalizer ? normalizer(parsed) : parsed;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;

      const isJsonError =
        error instanceof SyntaxError ||
        String(error?.message || "").includes("Unexpected");

      if (attempt < maxRetries && isJsonError) {
        continue;
      }

      if (error?.statusCode) {
        throw error;
      }

      throw createHttpError(
        502,
        `AI execution failed: ${error?.message || "unknown error"}`,
        "We couldn't generate a reliable AI response right now.",
      );
    }
  }

  throw createHttpError(
    502,
    lastError?.message || "AI execution failed",
    "We couldn't generate a reliable AI response right now.",
  );
}

module.exports = {
  runPrompt,
};
