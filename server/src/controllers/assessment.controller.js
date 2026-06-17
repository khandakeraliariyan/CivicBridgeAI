const assessmentService = require("../services/assessment.service");

const createAssessment = async (req, res) => {
    try {
        const { situation } = req.body;

        const result =
            await assessmentService.createAssessment(
                req.dbUser.id,
                situation
            );

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createAssessment,
};