const caseService = require("../services/case.service");
const caseRepository = require("../repositories/case.repository");
const reassessmentService = require("../services/reassessment.service");
const simulationService = require("../services/simulation.service");
const timelineService = require("../services/timeline.service");
const {
  addTimelineEvent,
  ensureTimelineAvailable,
} = require("../services/timeline.service");
const { sendError } = require("../utils/http-error");

async function ensureCaseOwnership(caseId, userId) {
  const { data: caseRecord, error } = await caseRepository.getCaseByIdForUser(
    caseId,
    userId,
  );

  if (error || !caseRecord) {
    const notFoundError = new Error("Case not found");
    notFoundError.statusCode = 404;
    throw notFoundError;
  }

  return caseRecord;
}

async function listCases(req, res) {
  try {
    const result = await caseService.listCasesForUser(req.dbUser.id, req.query);

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to load cases right now.");
  }
}

async function getCaseDetail(req, res) {
  try {
    const result = await caseService.getCaseWorkspace(
      req.params.caseId,
      req.dbUser.id,
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to load the case right now.");
  }
}

async function updateCase(req, res) {
  try {
    const result = await caseService.updateCase(
      req.params.caseId,
      req.dbUser.id,
      req.body,
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to update the case right now.");
  }
}

async function listCaseTimeline(req, res) {
  try {
    const page = Number.parseInt(req.query.page || "1", 10);
    const limit = Number.parseInt(req.query.limit || "10", 10);
    const result = await timelineService.listTimeline(
      req.params.caseId,
      req.dbUser.id,
      page,
      limit,
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to load the case timeline right now.");
  }
}

async function createTimelineNote(req, res) {
  try {
    await ensureTimelineAvailable();
    await ensureCaseOwnership(req.params.caseId, req.dbUser.id);
    const event = await addTimelineEvent({
      case_id: req.params.caseId,
      event_type: "USER_NOTE_ADDED",
      payload: {
        note: String(req.body.note).trim(),
      },
      created_by: req.dbUser.id,
    });

    return res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to save the timeline note right now.");
  }
}

async function createReassessment(req, res) {
  try {
    const result = await reassessmentService.createReassessmentForCase(
      req.params.caseId,
      req.dbUser.id,
      req.body,
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to complete the reassessment right now.");
  }
}

async function listReassessments(req, res) {
  try {
    const result = await reassessmentService.listReassessmentsForCase(
      req.params.caseId,
      req.dbUser.id,
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to load reassessments right now.");
  }
}

async function listCaseSimulations(req, res) {
  try {
    await caseService.ensureCaseHistoryAvailable();
    await ensureCaseOwnership(req.params.caseId, req.dbUser.id);
    const result = await simulationService.getCaseSimulationHistory(
      req.params.caseId,
    );

    return res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(error);
    return sendError(res, error, "Unable to load case simulations right now.");
  }
}

module.exports = {
  listCases,
  getCaseDetail,
  listCaseSimulations,
  listCaseTimeline,
  listReassessments,
  createReassessment,
  createTimelineNote,
  updateCase,
};
