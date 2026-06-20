function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}

const validateAssessment = (req, res, next) => {
    const { situation, intakeProfile } =
        req.body;

    if (
        !situation ||
        situation.trim().length < 10
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Situation must contain at least 10 characters",
        });
    }

    if (situation.trim().length > 5000) {
        return res.status(400).json({
            success: false,
            message:
                "Situation must be 5000 characters or fewer",
        });
    }

    if (intakeProfile !== undefined) {
        if (typeof intakeProfile !== "object" || intakeProfile === null || Array.isArray(intakeProfile)) {
            return res.status(400).json({
                success: false,
                message: "intakeProfile must be an object when provided",
            });
        }

        if (
            intakeProfile.primaryConcerns !== undefined &&
            !isStringArray(intakeProfile.primaryConcerns)
        ) {
            return res.status(400).json({
                success: false,
                message: "primaryConcerns must be a list of strings",
            });
        }
    }

    next();
};

module.exports =
    validateAssessment;
