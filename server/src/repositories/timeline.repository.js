const supabase = require("../config/supabase");

function isTimelineSchemaReady() {
  return supabase
    .from("timeline_events")
    .select("id")
    .limit(1)
    .then(({ error }) => !error);
}

function createTimelineEvent(event) {
  return supabase
    .from("timeline_events")
    .insert(event)
    .select()
    .single();
}

function listTimelineEventsByCaseId(caseId, page = 1, limit = 10) {
  const offset = (page - 1) * limit;

  return supabase
    .from("timeline_events")
    .select("*", { count: "exact" })
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
}

module.exports = {
  createTimelineEvent,
  isTimelineSchemaReady,
  listTimelineEventsByCaseId,
};
