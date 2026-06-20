const dashboardService = require("../services/dashboard.service");
const { sendError } = require("../utils/http-error");

async function getDashboardSummary(req, res) {
  try {
    const data = await dashboardService.getDashboardSummary(
      req.dbUser.id,
      typeof req.query.caseId === "string" ? req.query.caseId : null,
    );

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to load the dashboard summary right now.");
  }
}

module.exports = {
  getDashboardSummary,
};
