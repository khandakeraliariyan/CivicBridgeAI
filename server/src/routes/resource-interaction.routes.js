const express = require("express");

const verifyFirebaseToken = require("../middleware/auth.middleware");
const {
  updateResourceInteraction,
} = require("../controllers/resource-interaction.controller");
const {
  validateResourceInteractionPatch,
} = require("../validators/resource-interaction.validator");

const router = express.Router();

router.patch(
  "/:interactionId",
  verifyFirebaseToken,
  validateResourceInteractionPatch,
  updateResourceInteraction,
);

module.exports = router;
