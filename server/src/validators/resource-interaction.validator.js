const STATUSES = [
  "SAVED",
  "CONTACTED",
  "WAITING_FOR_RESPONSE",
  "COMPLETED",
  "REJECTED",
];

function validateResourceInteractionCreate(req, res, next) {
  const { resourceId, status } = req.body;

  if (!resourceId) {
    return res.status(400).json({ success: false, message: "resourceId required" });
  }

  if (status !== undefined && !STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: "status is invalid" });
  }

  next();
}

function validateResourceInteractionPatch(req, res, next) {
  const { status, followUpAt, responseNote, applicationReference } = req.body;

  if (status !== undefined && !STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: "status is invalid" });
  }

  if (
    followUpAt !== undefined &&
    followUpAt !== null &&
    followUpAt !== "" &&
    Number.isNaN(Date.parse(String(followUpAt)))
  ) {
    return res.status(400).json({ success: false, message: "followUpAt must be a valid date" });
  }

  if (
    status === undefined &&
    followUpAt === undefined &&
    responseNote === undefined &&
    applicationReference === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "At least one resource interaction field must be provided",
    });
  }

  next();
}

module.exports = {
  RESOURCE_INTERACTION_STATUSES: STATUSES,
  validateResourceInteractionCreate,
  validateResourceInteractionPatch,
};
