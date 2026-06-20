const supabase = require("../config/supabase");

const getAllResources = async () => {
    return await supabase
        .from("resources")
        .select("*");
};

const getResourceById = async (resourceId) => {
    return await supabase
        .from("resources")
        .select("*")
        .eq("id", resourceId)
        .single();
};

module.exports = {
    getAllResources,
    getResourceById,
};
