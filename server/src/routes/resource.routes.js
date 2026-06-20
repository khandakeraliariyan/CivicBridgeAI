const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middleware/auth.middleware");

const { getRecommendations, } = require("../controllers/resource.controller");
const {
  createResourceInteraction,
  listResourceInteractions,
} = require("../controllers/resource-interaction.controller");
const {
  estimateEligibility,
  generateApplicationAssistance,
} = require("../controllers/eligibility.controller");
const {
  validateApplicationAssistanceRequest,
  validateEligibilityRequest,
} = require("../validators/eligibility.validator");
const {
  validateResourceInteractionCreate,
} = require("../validators/resource-interaction.validator");

router.post("/recommend", verifyFirebaseToken, getRecommendations);
router.post(
  "/cases/:caseId/interactions",
  verifyFirebaseToken,
  validateResourceInteractionCreate,
  createResourceInteraction,
);
router.get(
  "/cases/:caseId/interactions",
  verifyFirebaseToken,
  listResourceInteractions,
);
router.post(
  "/cases/:caseId/:resourceId/eligibility",
  verifyFirebaseToken,
  validateEligibilityRequest,
  estimateEligibility,
);
router.post(
  "/cases/:caseId/:resourceId/application-assistance",
  verifyFirebaseToken,
  validateEligibilityRequest,
  validateApplicationAssistanceRequest,
  generateApplicationAssistance,
);

module.exports = router;
