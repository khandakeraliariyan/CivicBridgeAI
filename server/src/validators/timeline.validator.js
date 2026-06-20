function validateTimelineList(req, res, next) {
  const { page, limit } = req.query;

  if (page && (!Number.isInteger(Number(page)) || Number(page) < 1)) {
    return res.status(400).json({
      success: false,
      message: "page must be a positive integer",
    });
  }

  if (limit && (!Number.isInteger(Number(limit)) || Number(limit) < 1)) {
    return res.status(400).json({
      success: false,
      message: "limit must be a positive integer",
    });
  }

  next();
}

function validateTimelineNote(req, res, next) {
  const { note } = req.body;

  if (!note || String(note).trim().length < 3 || String(note).trim().length > 1000) {
    return res.status(400).json({
      success: false,
      message: "note must be between 3 and 1000 characters",
    });
  }

  next();
}

module.exports = {
  validateTimelineList,
  validateTimelineNote,
};
