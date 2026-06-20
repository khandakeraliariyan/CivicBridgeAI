const eligibilityService = require("../services/eligibility.service");
const { sendError } = require("../utils/http-error");

async function estimateEligibility(req, res) {
  try {
    const data = await eligibilityService.estimateEligibility(
      req.params.caseId,
      req.params.resourceId,
      req.dbUser.id,
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to estimate eligibility right now.");
  }
}

async function generateApplicationAssistance(req, res) {
  try {
    const data = await eligibilityService.generateApplicationAssistance(
      req.params.caseId,
      req.params.resourceId,
      req.dbUser.id,
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to generate application assistance right now.");
  }
}

module.exports = {
  estimateEligibility,
  generateApplicationAssistance,
};
