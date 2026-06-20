import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { CaseRecord, RoadmapItem } from "@/types/domain";

export interface DashboardSummary {
  currentCase: CaseRecord | null;
  highestRisk: string | null;
  latestStabilityScore: number | null;
  tasksDueToday: RoadmapItem[];
  overdueTasks: RoadmapItem[];
  nextRecommendedTasks: RoadmapItem[];
  blockedTasks: RoadmapItem[];
  completedTaskCount: number;
  totalTaskCount: number;
  lastActivity: string | null;
}

export function fetchDashboardSummary(caseId?: string | null) {
  const search = new URLSearchParams();

  if (caseId) {
    search.set("caseId", caseId);
  }

  const query = search.toString();

  return apiClient.get<ApiSuccessResponse<DashboardSummary>>(
    `/dashboard/summary${query ? `?${query}` : ""}`,
  );
}
