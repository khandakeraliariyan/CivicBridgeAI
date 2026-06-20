const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middleware/auth.middleware");
const { sendError } = require("../utils/http-error");

router.get("/me", verifyFirebaseToken, async (req, res) => {
    try {
        res.json({
            success: true,
            firebaseUser: req.user,
            databaseUser: req.dbUser,
        });
    } catch (error) {
        return sendError(res, error, "Unable to load the current user.");
    }
}
);

module.exports = router;
