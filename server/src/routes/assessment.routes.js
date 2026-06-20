const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middleware/auth.middleware");

const {
    createAssessment,
    screenAssessmentSafety,
} = require("../controllers/assessment.controller");

const validateAssessment = require("../validators/assessment.validator");

router.post("/safety-screening", verifyFirebaseToken, validateAssessment, screenAssessmentSafety);
router.post("/", verifyFirebaseToken, validateAssessment, createAssessment);

module.exports = router;
