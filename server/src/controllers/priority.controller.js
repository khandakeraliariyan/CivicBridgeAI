const priorityRepository = require("../repositories/priority.repository");

const { verifyAssessmentOwnership, } = require("../services/ownership.service");
const { sendError } = require("../utils/http-error");

const getPriorities = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        await verifyAssessmentOwnership(
            assessmentId,
            req.dbUser.id
        );

        const { data, error } =
            await priorityRepository.getPrioritiesByAssessmentId(
                assessmentId
            );

        if (error) {
            throw error;
        }

        return res.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error(error);

        return sendError(res, error, "Unable to load priorities right now.");
    }
};

module.exports = {
    getPriorities,
};
