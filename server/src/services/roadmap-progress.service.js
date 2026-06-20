const { enableTaskProgress } = require("../config/features");
const roadmapRepository = require("../repositories/roadmap.repository");
const { verifyRoadmapOwnership } = require("./ownership.service");
const { createHttpError } = require("../utils/http-error");

async function ensureTaskProgressAvailable() {
  if (!enableTaskProgress) {
    throw createHttpError(
      503,
      "Task progress is disabled",
      "Roadmap task updates are not available yet.",
    );
  }

  const schemaReady = await roadmapRepository.isTaskProgressSchemaReady();

  if (!schemaReady) {
    throw createHttpError(
      503,
      "Task progress schema is unavailable",
      "Roadmap task updates are not available yet.",
    );
  }
}

async function updateRoadmapTask(roadmapId, userId, updates) {
  await ensureTaskProgressAvailable();

  const roadmapTask = await verifyRoadmapOwnership(roadmapId, userId);
  const patch = {
    updated_at: new Date().toISOString(),
  };

  if (updates.status !== undefined) {
    patch.status = updates.status;

    if (updates.status === "IN_PROGRESS" && !roadmapTask.started_at) {
      patch.started_at = new Date().toISOString();
    }

    if (updates.status === "COMPLETED") {
      patch.completed_at = new Date().toISOString();
    } else {
      patch.completed_at = null;
    }
  }

  if (updates.dueAt !== undefined) {
    patch.due_at = updates.dueAt;
  }

  if (updates.userNote !== undefined) {
    patch.user_note = updates.userNote;
  }

  if (updates.outcome !== undefined) {
    patch.outcome = updates.outcome;
  }

  const { data, error } = await roadmapRepository.updateRoadmapTask(
    roadmapId,
    patch,
  );

  if (error) {
    throw error;
  }

  return data;
}

module.exports = {
  updateRoadmapTask,
};
