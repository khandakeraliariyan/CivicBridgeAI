const supabase = require("../config/supabase");

function isResourceInteractionsSchemaReady() {
  return supabase
    .from("resource_interactions")
    .select("id")
    .limit(1)
    .then(({ error }) => !error);
}

function createResourceInteraction(data) {
  return supabase
    .from("resource_interactions")
    .insert(data)
    .select()
    .single();
}

function getResourceInteractionByCaseAndResource(caseId, resourceId) {
  return supabase
    .from("resource_interactions")
    .select("*")
    .eq("case_id", caseId)
    .eq("resource_id", resourceId)
    .maybeSingle();
}

function listResourceInteractionsByCaseId(caseId) {
  return supabase
    .from("resource_interactions")
    .select("*")
    .eq("case_id", caseId)
    .order("updated_at", { ascending: false });
}

function getResourceInteractionById(interactionId) {
  return supabase
    .from("resource_interactions")
    .select("*")
    .eq("id", interactionId)
    .single();
}

function updateResourceInteraction(interactionId, patch) {
  return supabase
    .from("resource_interactions")
    .update(patch)
    .eq("id", interactionId)
    .select()
    .single();
}

module.exports = {
  createResourceInteraction,
  getResourceInteractionByCaseAndResource,
  getResourceInteractionById,
  isResourceInteractionsSchemaReady,
  listResourceInteractionsByCaseId,
  updateResourceInteraction,
};
