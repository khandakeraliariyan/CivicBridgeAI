const assessmentService = require("../services/assessment.service");
const { getSafetyScreeningResult } = require("../services/safety-screening.service");
const { sendError } = require("../utils/http-error");

const createAssessment = async (req, res) => {
    try {
        const { situation, intakeProfile } = req.body;

        const result =
            await assessmentService.createAssessment(
                req.dbUser.id,
                situation,
                intakeProfile || null,
            );

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(error);

        return sendError(
            res,
            error,
            "Unable to create the assessment right now."
        );
    }
};

const screenAssessmentSafety = async (req, res) => {
    try {
        const { situation } = req.body;

        return res.json({
            success: true,
            data: getSafetyScreeningResult(situation),
        });
    } catch (error) {
        console.error(error);

        return sendError(
            res,
            error,
            "Unable to complete the safety screening right now."
        );
    }
};

module.exports = {
    createAssessment,
    screenAssessmentSafety,
};
