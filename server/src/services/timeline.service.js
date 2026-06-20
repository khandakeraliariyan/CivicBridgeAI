const { enableTimeline } = require("../config/features");
const timelineRepository = require("../repositories/timeline.repository");
const caseRepository = require("../repositories/case.repository");
const { createHttpError } = require("../utils/http-error");

async function ensureTimelineAvailable() {
  if (!enableTimeline) {
    throw createHttpError(
      503,
      "Timeline is disabled",
      "Case timeline is not available yet.",
    );
  }

  const ready = await timelineRepository.isTimelineSchemaReady();

  if (!ready) {
    throw createHttpError(
      503,
      "Timeline schema is unavailable",
      "Case timeline is not available yet.",
    );
  }
}

async function addTimelineEvent(event) {
  if (!enableTimeline) {
    return null;
  }

  const ready = await timelineRepository.isTimelineSchemaReady();
  if (!ready) {
    return null;
  }

  const { data, error } = await timelineRepository.createTimelineEvent(event);
  if (error) {
    throw error;
  }

  return data;
}

async function listTimeline(caseId, userId, page = 1, limit = 10) {
  await ensureTimelineAvailable();

  const { data: caseRecord, error } = await caseRepository.getCaseByIdForUser(
    caseId,
    userId,
  );

  if (error || !caseRecord) {
    throw createHttpError(404, "Case not found");
  }

  const { data, error: timelineError, count } =
    await timelineRepository.listTimelineEventsByCaseId(caseId, page, limit);

  if (timelineError) {
    throw timelineError;
  }

  return {
    items: data || [],
    pagination: {
      page,
      limit,
      total: count ?? data.length,
      totalPages: Math.max(1, Math.ceil((count ?? data.length) / limit)),
    },
  };
}

module.exports = {
  addTimelineEvent,
  ensureTimelineAvailable,
  listTimeline,
};
