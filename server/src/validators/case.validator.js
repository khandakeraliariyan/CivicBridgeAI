const { createHttpError } = require("../utils/http-error");

const ALLOWED_CASE_STATUSES = [
  "ACTIVE",
  "URGENT",
  "STABLE",
  "RESOLVED",
  "ARCHIVED",
];

function validateCaseList(req, res, next) {
  const { page, limit, status, archived, sort } = req.query;

  if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: "page must be a positive integer",
    });
  }

  if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
    return res.status(400).json({
      success: false,
      message: "limit must be a positive integer",
    });
  }

  if (status && !ALLOWED_CASE_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "status is invalid",
    });
  }

  if (
    archived &&
    !["true", "false", "1", "0"].includes(String(archived).toLowerCase())
  ) {
    return res.status(400).json({
      success: false,
      message: "archived must be true or false",
    });
  }

  if (
    sort &&
    !["updated_desc", "updated_asc", "created_desc", "created_asc"].includes(
      sort,
    )
  ) {
    return res.status(400).json({
      success: false,
      message: "sort is invalid",
    });
  }

  next();
}

function validateCasePatch(req, res, next) {
  const { title, status } = req.body;

  if (title !== undefined && (!String(title).trim() || String(title).length > 160)) {
    return res.status(400).json({
      success: false,
      message: "title must be between 1 and 160 characters",
    });
  }

  if (status !== undefined && !ALLOWED_CASE_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "status is invalid",
    });
  }

  if (title === undefined && status === undefined) {
    return next(
      createHttpError(400, "At least one updatable field is required"),
    );
  }

  next();
}

module.exports = {
  ALLOWED_CASE_STATUSES,
  validateCaseList,
  validateCasePatch,
};
