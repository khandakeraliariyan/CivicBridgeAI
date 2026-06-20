const supabase = require("../config/supabase");

const createAssessment = async (assessmentData) => {
    return await supabase
        .from("assessments")
        .insert(assessmentData)
        .select()
        .single();
};

const getAssessmentById = async (assessmentId) => {
    return await supabase
        .from("assessments")
        .select("*")
        .eq("id", assessmentId)
        .single();
};

const getAssessmentsByCaseId = async (caseId) => {
    return await supabase
        .from("assessments")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });
};

const deleteAssessmentById = async (assessmentId) => {
    return await supabase
        .from("assessments")
        .delete()
        .eq("id", assessmentId);
};

module.exports = {
    createAssessment,
    getAssessmentById,
    getAssessmentsByCaseId,
    deleteAssessmentById,
};
