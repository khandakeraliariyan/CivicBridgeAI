const simulationRepository = require("../repositories/simulation.repository");
const assessmentRepository = require("../repositories/assessment.repository");

const { simulateDecision, } = require("./ai/consequence-simulator.service");
const { addTimelineEvent } = require("./timeline.service");

const createSimulation = async ({ assessment, analysis, decision, }) => {
    const simulation =
        await simulateDecision(
            assessment.situation_text,
            analysis,
            decision
        );

    const { data } =
        await simulationRepository.createSimulation({
            assessment_id: assessment.id,

            decision,

            housing_impact:
                simulation.housingImpact,

            income_impact:
                simulation.incomeImpact,

            health_impact:
                simulation.healthImpact,

            summary:
                simulation.summary,

            recommended_action:
                simulation.recommendedAction,
        });

    if (assessment.case_id) {
        await addTimelineEvent({
            case_id: assessment.case_id,
            assessment_id: assessment.id,
            event_type: "SIMULATION_CREATED",
            payload: {
                decision,
            },
            created_by: assessment.user_id,
        });
    }

    return {
        simulation,
        savedSimulation: data,
    };
};

const getCaseSimulationHistory = async (caseId) => {
    const { data: assessments, error: assessmentError } =
        await assessmentRepository.getAssessmentsByCaseId(caseId);

    if (assessmentError) {
        throw assessmentError;
    }

    const assessmentIds = (assessments || []).map((assessment) => assessment.id);

    if (!assessmentIds.length) {
        return [];
    }

    const { data, error } =
        await simulationRepository.getSimulationsByAssessmentIds(
            assessmentIds
        );

    if (error) {
        throw error;
    }

    return (data || []).map((simulation) => ({
        ...simulation,
        assessmentVersion:
            assessments.find((assessment) => assessment.id === simulation.assessment_id)
                ?.created_at || null,
    }));
};

module.exports = {
    createSimulation,
    getCaseSimulationHistory,
};
