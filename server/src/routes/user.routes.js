const express = require("express");

const router = express.Router();

const verifyFirebaseToken = require("../middleware/auth.middleware");

router.get("/me", verifyFirebaseToken, async (req, res) => {
    try {
        res.json({
            success: true,
            firebaseUser: req.user,
            databaseUser: req.dbUser,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}
);

module.exports = router;