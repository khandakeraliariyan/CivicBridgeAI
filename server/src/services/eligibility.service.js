const {
  enableCaseHistory,
  enableEligibilityAssistance,
} = require("../config/features");
const caseRepository = require("../repositories/case.repository");
const resourceRepository = require("../repositories/resource.repository");
const { runPrompt } = require("../utils/ai-executor");
const {
  normalizeApplicationAssistance,
  normalizeEligibility,
} = require("../utils/ai-normalizers");
const { createHttpError } = require("../utils/http-error");

function buildEligibilityPrompt(caseRecord, assessment, resource) {
  return `
You are an advisory civic eligibility assistant.

Case summary:
${caseRecord.summary || ""}

Situation:
${assessment.situation_text}

Resource:
${JSON.stringify(resource)}

Return ONLY JSON:
{
  "likelihood":"LOW|MEDIUM|HIGH|INSUFFICIENT_INFORMATION",
  "reasons":[""],
  "missingInformation":[""],
  "requiredDocuments":[""],
  "disclaimer":""
}
`;
}

function buildApplicationAssistancePrompt(caseRecord, assessment, resource) {
  return `
You are an advisory application-assistance assistant.

Case summary:
${caseRecord.summary || ""}

Situation:
${assessment.situation_text}

Resource:
${JSON.stringify(resource)}

Return ONLY JSON:
{
  "checklist":[""],
  "emailDraft":"",
  "phoneScript":"",
  "requestLetter":"",
  "questionsToAsk":[""],
  "documentChecklist":[""],
  "disclaimer":""
}
`;
}

async function verifyCaseAndResource(caseId, resourceId, userId) {
  if (!enableEligibilityAssistance) {
    throw createHttpError(
      503,
      "Eligibility assistance is disabled",
      "Eligibility guidance is not available yet.",
    );
  }

  if (!enableCaseHistory) {
    throw createHttpError(
      503,
      "Case history is disabled",
      "Eligibility guidance is not available yet.",
    );
  }

  const schemaReady = await caseRepository.isCaseHistorySchemaReady();
  if (!schemaReady) {
    throw createHttpError(
      503,
      "Case history schema is unavailable",
      "Eligibility guidance is not available yet.",
    );
  }

  const { data: caseRecord, error } = await caseRepository.getCaseByIdForUser(
    caseId,
    userId,
  );

  if (error || !caseRecord) {
    throw createHttpError(404, "Case not found");
  }

  const { data: assessment } = await caseRepository.getLatestAssessmentForCase(
    caseId,
    caseRecord.current_assessment_id,
  );

  if (!assessment) {
    throw createHttpError(404, "Assessment not found");
  }

  const { data: resource, error: resourceError } =
    await resourceRepository.getResourceById(resourceId);

  if (resourceError || !resource) {
    throw createHttpError(404, "Resource not found");
  }

  return { caseRecord, assessment, resource };
}

async function estimateEligibility(caseId, resourceId, userId) {
  const { caseRecord, assessment, resource } = await verifyCaseAndResource(
    caseId,
    resourceId,
    userId,
  );

  const data = await runPrompt({
    prompt: buildEligibilityPrompt(caseRecord, assessment, resource),
    validator: (payload) => typeof payload === "object" && payload !== null,
    normalizer: normalizeEligibility,
  });

  return {
    ...data,
    disclaimer:
      data.disclaimer ||
      "This is advisory guidance only and not an official eligibility decision.",
  };
}

async function generateApplicationAssistance(caseId, resourceId, userId) {
  const { caseRecord, assessment, resource } = await verifyCaseAndResource(
    caseId,
    resourceId,
    userId,
  );

  const data = await runPrompt({
    prompt: buildApplicationAssistancePrompt(caseRecord, assessment, resource),
    validator: (payload) => typeof payload === "object" && payload !== null,
    normalizer: normalizeApplicationAssistance,
  });

  return {
    ...data,
    disclaimer:
      data.disclaimer ||
      "This assistance is advisory only and will never submit an application automatically.",
  };
}

module.exports = {
  estimateEligibility,
  generateApplicationAssistance,
};
