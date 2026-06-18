const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middleware/auth.middleware");

const { getRecommendations, } = require("../controllers/resource.controller");

const validateAssessment = require("../validators/assessment.validator");

router.post("/recommend", verifyFirebaseToken, getRecommendations);

module.exports = router;