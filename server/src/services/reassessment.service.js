const assessmentRepository = require("../repositories/assessment.repository");
const caseRepository = require("../repositories/case.repository");
const riskRepository = require("../repositories/risk.repository");
const { enableCaseHistory, enableReassessment } = require("../config/features");
const assessmentService = require("./assessment.service");
const { createHttpError } = require("../utils/http-error");

async function ensureReassessmentAvailable() {
  if (!enableCaseHistory || !enableReassessment) {
    throw createHttpError(
      503,
      "Reassessment is disabled",
      "Reassessment is not available yet.",
    );
  }
}

async function verifyCase(caseId, userId) {
  const { data: caseRecord, error } = await caseRepository.getCaseByIdForUser(
    caseId,
    userId,
  );

  if (error || !caseRecord) {
    throw createHttpError(404, "Case not found");
  }

  return caseRecord;
}

async function createReassessmentForCase(caseId, userId, body) {
  await ensureReassessmentAvailable();
  const caseRecord = await verifyCase(caseId, userId);

  const result = await assessmentService.createReassessment({
    caseRecord,
    userId,
    whatChanged: body.whatChanged,
    updatedSituationDetails: body.updatedSituationDetails,
    userNote: body.userNote,
  });

  const { data: previousRisk } = await riskRepository.getRiskAssessment(
    result.comparison.previousAssessmentId || caseRecord.current_assessment_id,
  );
  const { data: currentRisk } = await riskRepository.getRiskAssessment(result.assessment.id);

  return {
    ...result,
    comparison: {
      ...result.comparison,
      previousHousingRisk: previousRisk?.housing_risk || null,
      currentHousingRisk: currentRisk?.housing_risk || null,
      previousIncomeRisk: previousRisk?.income_risk || null,
      currentIncomeRisk: currentRisk?.income_risk || null,
      previousHealthcareRisk: previousRisk?.healthcare_risk || null,
      currentHealthcareRisk: currentRisk?.healthcare_risk || null,
      previousOverallRisk: previousRisk?.overall_risk || null,
      currentOverallRisk: currentRisk?.overall_risk || null,
      summary:
        result.comparison.scoreDelta > 0
          ? "Overall stability appears to have improved."
          : result.comparison.scoreDelta < 0
            ? "Overall stability appears to have worsened."
            : "Overall stability appears unchanged.",
    },
  };
}

async function listReassessmentsForCase(caseId, userId) {
  await ensureReassessmentAvailable();
  await verifyCase(caseId, userId);

  const { data: assessments, error } = await assessmentRepository.getAssessmentsByCaseId(caseId);

  if (error) {
    throw error;
  }

  return (assessments || []).filter(
    (assessment) => assessment.assessment_kind === "REASSESSMENT",
  );
}

module.exports = {
  createReassessmentForCase,
  listReassessmentsForCase,
};
