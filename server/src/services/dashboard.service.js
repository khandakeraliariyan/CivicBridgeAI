const {
  enableCaseHistory,
  enableDailyActions,
  enableTaskProgress,
} = require("../config/features");
const caseRepository = require("../repositories/case.repository");
const roadmapRepository = require("../repositories/roadmap.repository");
const { createHttpError } = require("../utils/http-error");

function startOfDay(value) {
  const next = new Date(value);
  next.setUTCHours(0, 0, 0, 0);
  return next;
}

function compareByDueDate(a, b) {
  if (!a.due_at && !b.due_at) {
    return 0;
  }

  if (!a.due_at) {
    return 1;
  }

  if (!b.due_at) {
    return -1;
  }

  return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
}

function compareBySortOrder(a, b) {
  return (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER);
}

function orderRecommendedTasks(tasks, today) {
  const overdueInProgress = [];
  const overdueNotStarted = [];
  const dueToday = [];
  const inProgressWithoutDueDate = [];
  const notStarted = [];
  const blocked = [];

  for (const task of tasks) {
    const status = task.status ?? "NOT_STARTED";
    const dueDate = task.due_at ? startOfDay(task.due_at) : null;
    const isOverdue = dueDate ? dueDate.getTime() < today.getTime() : false;
    const isDueToday = dueDate ? dueDate.getTime() === today.getTime() : false;

    if (status === "BLOCKED") {
      blocked.push(task);
      continue;
    }

    if (status === "COMPLETED") {
      continue;
    }

    if (status === "IN_PROGRESS" && isOverdue) {
      overdueInProgress.push(task);
      continue;
    }

    if (status === "NOT_STARTED" && isOverdue) {
      overdueNotStarted.push(task);
      continue;
    }

    if (isDueToday) {
      dueToday.push(task);
      continue;
    }

    if (status === "IN_PROGRESS" && !dueDate) {
      inProgressWithoutDueDate.push(task);
      continue;
    }

    if (status === "NOT_STARTED") {
      notStarted.push(task);
    }
  }

  return {
    overdueTasks: [...overdueInProgress, ...overdueNotStarted].sort(compareByDueDate),
    tasksDueToday: dueToday.sort(compareByDueDate),
    nextRecommendedTasks: [
      ...overdueInProgress.sort(compareByDueDate),
      ...overdueNotStarted.sort(compareByDueDate),
      ...dueToday.sort(compareByDueDate),
      ...inProgressWithoutDueDate,
      ...notStarted.sort(compareBySortOrder),
    ],
    blockedTasks: blocked.sort(compareBySortOrder),
  };
}

async function ensureDailyActionsAvailable() {
  if (!enableCaseHistory || !enableTaskProgress || !enableDailyActions) {
    throw createHttpError(
      503,
      "Daily actions are disabled",
      "Daily action planning is not available yet.",
    );
  }

  const [caseSchemaReady, taskProgressReady] = await Promise.all([
    caseRepository.isCaseHistorySchemaReady(),
    roadmapRepository.isTaskProgressSchemaReady(),
  ]);

  if (!caseSchemaReady || !taskProgressReady) {
    throw createHttpError(
      503,
      "Daily actions schema is unavailable",
      "Daily action planning is not available yet.",
    );
  }
}

async function getDashboardSummary(userId, selectedCaseId = null) {
  await ensureDailyActionsAvailable();

  const { data: currentCase, error: caseError } = selectedCaseId
    ? await caseRepository.getCaseByIdForUser(selectedCaseId, userId)
    : await caseRepository.getCurrentCaseForUser(userId);

  if (caseError) {
    throw caseError;
  }

  if (!currentCase?.current_assessment_id) {
    return {
      currentCase: null,
      highestRisk: null,
      latestStabilityScore: null,
      tasksDueToday: [],
      overdueTasks: [],
      nextRecommendedTasks: [],
      blockedTasks: [],
      completedTaskCount: 0,
      totalTaskCount: 0,
      lastActivity: null,
    };
  }

  const { data: roadmapTasks, error: roadmapError } =
    await roadmapRepository.getRoadmapByAssessmentId(currentCase.current_assessment_id);

  if (roadmapError) {
    throw roadmapError;
  }

  const today = startOfDay(new Date().toISOString());
  const ordered = orderRecommendedTasks(roadmapTasks || [], today);
  const completedTaskCount = (roadmapTasks || []).filter(
    (task) => task.status === "COMPLETED",
  ).length;

  return {
    currentCase,
    highestRisk: currentCase.main_risk ?? null,
    latestStabilityScore: currentCase.latest_stability_score ?? null,
    tasksDueToday: ordered.tasksDueToday,
    overdueTasks: ordered.overdueTasks,
    nextRecommendedTasks: ordered.nextRecommendedTasks.slice(0, 5),
    blockedTasks: ordered.blockedTasks,
    completedTaskCount,
    totalTaskCount: (roadmapTasks || []).filter(
      (task) => (task.status ?? "NOT_STARTED") !== "BLOCKED",
    ).length,
    lastActivity: currentCase.last_activity_at ?? null,
  };
}

module.exports = {
  getDashboardSummary,
  orderRecommendedTasks,
};
