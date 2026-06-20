function validateEligibilityRequest(req, res, next) {
  if (!req.params.caseId || !req.params.resourceId) {
    return res.status(400).json({
      success: false,
      message: "caseId and resourceId are required",
    });
  }

  next();
}

function validateApplicationAssistanceRequest(req, res, next) {
  const { requestedFormat } = req.body;
  const formats = ["CHECKLIST", "EMAIL_DRAFT", "PHONE_SCRIPT", "REQUEST_LETTER", "FULL"];

  if (requestedFormat !== undefined && !formats.includes(requestedFormat)) {
    return res.status(400).json({
      success: false,
      message: "requestedFormat is invalid",
    });
  }

  next();
}

module.exports = {
  validateApplicationAssistanceRequest,
  validateEligibilityRequest,
};
