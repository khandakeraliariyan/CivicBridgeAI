const supabase = require("../config/supabase");

const createPriorities = async (priorities) => {
    return await supabase
        .from("priorities")
        .insert(priorities)
        .select();
};

const getPrioritiesByAssessmentId = async (assessmentId) => {
    return await supabase
        .from("priorities")
        .select("*")
        .eq(
            "assessment_id",
            assessmentId
        )
        .order(
            "priority_order",
            {
                ascending: true,
            }
        );
};

module.exports = {
    createPriorities,
    getPrioritiesByAssessmentId,
};