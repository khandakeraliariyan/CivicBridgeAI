const supabase = require("../config/supabase");

async function isCaseHistorySchemaReady() {
  const { error } = await supabase
    .from("cases")
    .select("id")
    .limit(1);

  return !error;
}

async function createCase(caseData) {
  return supabase
    .from("cases")
    .insert(caseData)
    .select()
    .single();
}

async function updateCaseById(caseId, updates) {
  return supabase
    .from("cases")
    .update(updates)
    .eq("id", caseId)
    .select()
    .single();
}

async function getCaseByIdForUser(caseId, userId) {
  return supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("user_id", userId)
    .single();
}

async function listCasesForUser({
  userId,
  page = 1,
  limit = 10,
  status,
  archived = false,
  sort = "updated_desc",
}) {
  const offset = (page - 1) * limit;
  const [sortField, direction] = sort.split("_");
  const columnMap = {
    updated: "updated_at",
    created: "created_at",
  };
  const column = columnMap[sortField] || "updated_at";
  let query = supabase
    .from("cases")
    .select("*", { count: "exact" })
    .eq("user_id", userId);

  if (status) {
    query = query.eq("status", status);
  }

  if (archived) {
    query = query.not("archived_at", "is", null);
  } else {
    query = query.is("archived_at", null);
  }

  return query
    .order(column, { ascending: direction === "asc" })
    .range(offset, offset + limit - 1);
}

async function linkAssessmentToCase({
  assessmentId,
  caseId,
  assessmentKind = "INITIAL",
  changeNote = null,
  previousAssessmentId = null,
}) {
  return supabase
    .from("assessments")
    .update({
      case_id: caseId,
      assessment_kind: assessmentKind,
      change_note: changeNote,
      previous_assessment_id: previousAssessmentId,
    })
    .eq("id", assessmentId)
    .select()
    .single();
}

async function getLatestAssessmentForCase(caseId, currentAssessmentId) {
  if (currentAssessmentId) {
    return supabase
      .from("assessments")
      .select("*")
      .eq("id", currentAssessmentId)
      .eq("case_id", caseId)
      .single();
  }

  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("case_id", caseId)
    .order("created_at", { ascending: false })
    .limit(1);

  return {
    data: data?.[0] ?? null,
    error: error ?? (!data?.length ? { message: "Assessment not found" } : null),
  };
}

async function getCurrentCaseForUser(userId) {
  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("last_activity_at", { ascending: false })
    .limit(1);

  return {
    data: data?.[0] ?? null,
    error,
  };
}

module.exports = {
  isCaseHistorySchemaReady,
  createCase,
  updateCaseById,
  getCaseByIdForUser,
  listCasesForUser,
  linkAssessmentToCase,
  getLatestAssessmentForCase,
  getCurrentCaseForUser,
};
