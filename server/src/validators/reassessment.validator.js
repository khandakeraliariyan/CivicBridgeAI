function validateReassessment(req, res, next) {
  const { whatChanged, updatedSituationDetails, userNote } = req.body;

  if (
    !whatChanged ||
    String(whatChanged).trim().length < 10
  ) {
    return res.status(400).json({
      success: false,
      message: "whatChanged must contain at least 10 characters",
    });
  }

  if (
    updatedSituationDetails !== undefined &&
    String(updatedSituationDetails).trim().length > 5000
  ) {
    return res.status(400).json({
      success: false,
      message: "updatedSituationDetails is too long",
    });
  }

  if (userNote !== undefined && String(userNote).trim().length > 1000) {
    return res.status(400).json({
      success: false,
      message: "userNote is too long",
    });
  }

  next();
}

module.exports = {
  validateReassessment,
};
