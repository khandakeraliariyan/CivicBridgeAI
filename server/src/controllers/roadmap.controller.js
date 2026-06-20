const roadmapRepository = require("../repositories/roadmap.repository");
const roadmapProgressService = require("../services/roadmap-progress.service");

const { verifyAssessmentOwnership, } = require("../services/ownership.service");
const { sendError } = require("../utils/http-error");

const getRoadmap = async (req, res) => {
    try {
        const { assessmentId } = req.params;

        await verifyAssessmentOwnership(
            assessmentId,
            req.dbUser.id
        );

        const { data, error } =
            await roadmapRepository.getRoadmapByAssessmentId(
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

        return sendError(res, error, "Unable to load roadmap items right now.");
    }
};

const updateRoadmapTask = async (req, res) => {
    try {
        const result = await roadmapProgressService.updateRoadmapTask(
            req.params.roadmapId,
            req.dbUser.id,
            req.roadmapPatch || req.body
        );

        return res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error(error);

        return sendError(res, error, "Unable to update the roadmap item right now.");
    }
};

module.exports = {
    getRoadmap,
    updateRoadmapTask,
};
