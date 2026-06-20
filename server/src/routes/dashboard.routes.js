const express = require("express");

const verifyFirebaseToken = require("../middleware/auth.middleware");
const { getDashboardSummary } = require("../controllers/dashboard.controller");

const router = express.Router();

router.get("/summary", verifyFirebaseToken, getDashboardSummary);

module.exports = router;
