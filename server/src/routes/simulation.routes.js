const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middleware/auth.middleware");

const { createSimulation, } = require("../controllers/simulation.controller");

const validateSimulation = require("../validators/simulation.validator");

router.post("/", verifyFirebaseToken, validateSimulation, createSimulation);

module.exports = router;