const { enableTaskProgress } = require("../config/features");
const roadmapRepository = require("../repositories/roadmap.repository");

const { generateRoadmap, } = require("./ai/roadmap-generator.service");

const createRoadmap = async (assessmentId, situation, analysis, priorities) => {
    const roadmapResult =
        await generateRoadmap(
            situation,
            analysis,
            priorities
        );

    const roadmapTasks =
        roadmapResult.roadmap.map(
            (item, index) => ({
                assessment_id: assessmentId,
                timeline: item.timeline,
                task: item.task,
                due_at: item.due_at ?? null,
                ...(enableTaskProgress ? {
                    status: "NOT_STARTED",
                    sort_order: index + 1,
                    is_user_created: false,
                } : {}),
            })
        );

    await roadmapRepository.createRoadmapTasks(
        roadmapTasks
    );

    return roadmapResult;
};

module.exports = {
    createRoadmap,
};
