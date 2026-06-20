const validateSimulation = (req, res, next) => {
    const {
        assessmentId,
        decision,
    } = req.body;

    if (!assessmentId) {
        return res.status(400).json({
            success: false,
            message:
                "assessmentId required",
        });
    }

    if (!decision) {
        return res.status(400).json({
            success: false,
            message:
                "decision required",
        });
    }

    if (String(decision).trim().length > 2000) {
        return res.status(400).json({
            success: false,
            message:
                "decision must be 2000 characters or fewer",
        });
    }

    next();
};

module.exports =
    validateSimulation;
