const assessmentRepository = require("../repositories/assessment.repository");

const verifyAssessmentOwnership = async (assessmentId, userId) => {
    const {
        data: assessment,
        error,
    } =
        await assessmentRepository.getAssessmentById(
            assessmentId
        );

    if (error || !assessment) {
        throw new Error(
            "Assessment not found"
        );
    }

    if (
        assessment.user_id !== userId
    ) {
        throw new Error(
            "Access denied"
        );
    }

    return assessment;
};

module.exports = {
    verifyAssessmentOwnership,
};