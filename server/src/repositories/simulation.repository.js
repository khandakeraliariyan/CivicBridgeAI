const supabase = require("../config/supabase");

const createSimulation = async (simulationData) => {
    return await supabase
        .from("simulations")
        .insert(simulationData)
        .select()
        .single();
};

const getSimulationsByAssessmentId = async (assessmentId) => {
    return await supabase
        .from("simulations")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("created_at", { ascending: false });
};

const getSimulationsByAssessmentIds = async (assessmentIds) => {
    if (!Array.isArray(assessmentIds) || !assessmentIds.length) {
        return {
            data: [],
            error: null,
        };
    }

    return await supabase
        .from("simulations")
        .select("*")
        .in("assessment_id", assessmentIds)
        .order("created_at", { ascending: false });
};

module.exports = {
    createSimulation,
    getSimulationsByAssessmentId,
    getSimulationsByAssessmentIds,
};
