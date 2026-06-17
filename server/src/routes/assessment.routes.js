const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middleware/auth.middleware");

const { createAssessment, } = require("../controllers/assessment.controller");

router.post("/", verifyFirebaseToken, createAssessment);

module.exports = router;