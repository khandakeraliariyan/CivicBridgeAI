const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middleware/auth.middleware");

const { createAssessment, } = require("../controllers/assessment.controller");

const validateAssessment = require("../validators/assessment.validator");

router.post("/", verifyFirebaseToken, validateAssessment, createAssessment);

module.exports = router;