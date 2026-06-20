const ROADMAP_STATUSES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
];

function normalizeOptionalText(value) {
  if (value === undefined) {
    return undefined;
  }

  const normalized = String(value).trim();
  return normalized ? normalized : null;
}

function validateRoadmapPatch(req, res, next) {
  const { status, dueAt, due_at, userNote, user_note, outcome } = req.body;

  if (status !== undefined && !ROADMAP_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "status is invalid",
    });
  }

  const nextDueAt = dueAt ?? due_at;
  if (
    nextDueAt !== undefined &&
    nextDueAt !== null &&
    nextDueAt !== "" &&
    Number.isNaN(Date.parse(String(nextDueAt)))
  ) {
    return res.status(400).json({
      success: false,
      message: "dueAt must be a valid date",
    });
  }

  const nextUserNote = normalizeOptionalText(userNote ?? user_note);
  if (nextUserNote !== undefined && nextUserNote !== null && nextUserNote.length > 2000) {
    return res.status(400).json({
      success: false,
      message: "userNote must be 2000 characters or fewer",
    });
  }

  const nextOutcome = normalizeOptionalText(outcome);
  if (nextOutcome !== undefined && nextOutcome !== null && nextOutcome.length > 2000) {
    return res.status(400).json({
      success: false,
      message: "outcome must be 2000 characters or fewer",
    });
  }

  if (
    status === undefined &&
    dueAt === undefined &&
    due_at === undefined &&
    userNote === undefined &&
    user_note === undefined &&
    outcome === undefined
  ) {
    return res.status(400).json({
      success: false,
      message: "At least one roadmap field must be provided",
    });
  }

  req.roadmapPatch = {
    status,
    dueAt:
      nextDueAt === undefined
        ? undefined
        : nextDueAt === null || nextDueAt === ""
          ? null
          : new Date(nextDueAt).toISOString(),
    userNote: nextUserNote,
    outcome: nextOutcome,
  };

  next();
}

module.exports = {
  ROADMAP_STATUSES,
  validateRoadmapPatch,
};
