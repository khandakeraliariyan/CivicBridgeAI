const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middleware/auth.middleware");

const { getPriorities, } = require("../controllers/priority.controller" );

router.get(
    "/:assessmentId",
    verifyFirebaseToken,
    getPriorities
);

module.exports = router;