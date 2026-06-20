const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middleware/auth.middleware");

const {
    getRoadmap,
    updateRoadmapTask,
} = require("../controllers/roadmap.controller");
const { validateRoadmapPatch } = require("../validators/roadmap.validator");

router.get(
    "/:assessmentId",
    verifyFirebaseToken,
    getRoadmap
);
router.patch(
    "/:roadmapId",
    verifyFirebaseToken,
    validateRoadmapPatch,
    updateRoadmapTask
);

module.exports = router;
