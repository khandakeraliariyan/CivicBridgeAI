const express = require("express");

const verifyFirebaseToken = require("../middleware/auth.middleware");
const {
  createReassessment,
  createTimelineNote,
  getCaseDetail,
  listCaseSimulations,
  listCaseTimeline,
  listCases,
  listReassessments,
  updateCase,
} = require("../controllers/case.controller");
const {
  validateCaseList,
  validateCasePatch,
} = require("../validators/case.validator");
const {
  createResourceInteraction,
  listResourceInteractions,
} = require("../controllers/resource-interaction.controller");
const {
  estimateEligibility,
  generateApplicationAssistance,
} = require("../controllers/eligibility.controller");
const {
  validateTimelineList,
  validateTimelineNote,
} = require("../validators/timeline.validator");
const { validateReassessment } = require("../validators/reassessment.validator");
const {
  validateApplicationAssistanceRequest,
  validateEligibilityRequest,
} = require("../validators/eligibility.validator");
const {
  validateResourceInteractionCreate,
} = require("../validators/resource-interaction.validator");

const router = express.Router();

router.get("/", verifyFirebaseToken, validateCaseList, listCases);
router.get("/:caseId/timeline", verifyFirebaseToken, validateTimelineList, listCaseTimeline);
router.post("/:caseId/timeline-notes", verifyFirebaseToken, validateTimelineNote, createTimelineNote);
router.get("/:caseId/reassessments", verifyFirebaseToken, listReassessments);
router.post("/:caseId/reassessments", verifyFirebaseToken, validateReassessment, createReassessment);
router.get("/:caseId/simulations", verifyFirebaseToken, listCaseSimulations);
router.get("/:caseId/resource-interactions", verifyFirebaseToken, listResourceInteractions);
router.post(
  "/:caseId/resource-interactions",
  verifyFirebaseToken,
  validateResourceInteractionCreate,
  createResourceInteraction,
);
router.post(
  "/:caseId/resources/:resourceId/eligibility",
  verifyFirebaseToken,
  validateEligibilityRequest,
  estimateEligibility,
);
router.post(
  "/:caseId/resources/:resourceId/application-assistance",
  verifyFirebaseToken,
  validateEligibilityRequest,
  validateApplicationAssistanceRequest,
  generateApplicationAssistance,
);
router.get("/:caseId", verifyFirebaseToken, getCaseDetail);
router.patch("/:caseId", verifyFirebaseToken, validateCasePatch, updateCase);

module.exports = router;
