const assessmentRepository = require("../repositories/assessment.repository");
const roadmapRepository = require("../repositories/roadmap.repository");

const verifyAssessmentOwnership = async (assessmentId, userId) => {
    const {
        data: assessment,
        error,
    } =
        await assessmentRepository.getAssessmentById(
            assessmentId
        );

    if (error || !assessment) {
        const err = new Error(
            "Assessment not found"
        );

        err.statusCode = 404;

        throw err;
    }

    if (
        assessment.user_id !== userId
    ) {
        const err = new Error(
            "Access denied"
        );

        err.statusCode = 403;

        throw err;
    }

    return assessment;
};

const verifyRoadmapOwnership = async (roadmapId, userId) => {
    const {
        data: roadmapTask,
        error,
    } = await roadmapRepository.getRoadmapTaskById(roadmapId);

    if (error || !roadmapTask) {
        const err = new Error("Roadmap item not found");
        err.statusCode = 404;
        throw err;
    }

    await verifyAssessmentOwnership(
        roadmapTask.assessment_id,
        userId
    );

    return roadmapTask;
};

module.exports = {
    verifyAssessmentOwnership,
    verifyRoadmapOwnership,
};
