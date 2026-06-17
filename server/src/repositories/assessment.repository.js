const supabase = require("../config/supabase");

const createAssessment = async (assessmentData) => {
    return await supabase
        .from("assessments")
        .insert(assessmentData)
        .select()
        .single();
};

module.exports = {
    createAssessment,
};