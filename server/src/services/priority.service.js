const priorityRepository = require("../repositories/priority.repository");

const savePriorities = async (assessmentId, priorities) => {
    const records =
        priorities.map((priority) => ({
            assessment_id:
                assessmentId,

            priority_order:
                priority.order ?? priority.priority_order,

            title:
                priority.title,

            reasoning:
                priority.reasoning,

            confidence_score:
                priority.confidence,
        }));

    return await priorityRepository.createPriorities(
        records
    );
};

module.exports = {
    savePriorities,
};
