const supabase = require("../config/supabase");

const createRiskAssessment = async (riskData) => {
    return await supabase
        .from("risk_assessments")
        .insert(riskData)
        .select()
        .single();
};

const getRiskAssessment = async (assessmentId) => {
    return await supabase
        .from("risk_assessments")
        .select("*")
        .eq("assessment_id", assessmentId)
        .single();
};

const deleteRiskAssessmentByAssessmentId = async (assessmentId) => {
    return await supabase
        .from("risk_assessments")
        .delete()
        .eq("assessment_id", assessmentId);
};

module.exports = {
    createRiskAssessment,
    getRiskAssessment,
    deleteRiskAssessmentByAssessmentId,
};
