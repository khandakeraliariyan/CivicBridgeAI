import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { RoadmapItem } from "@/types/domain";

export function fetchRoadmap(assessmentId: string) {
  return apiClient.get<ApiSuccessResponse<RoadmapItem[]>>(
    `/roadmaps/${assessmentId}`,
  );
}

export interface UpdateRoadmapTaskBody {
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "BLOCKED";
  dueAt?: string | null;
  userNote?: string | null;
  outcome?: string | null;
}

export function updateRoadmapTask(roadmapId: string, body: UpdateRoadmapTaskBody) {
  return apiClient.patch<ApiSuccessResponse<RoadmapItem>, UpdateRoadmapTaskBody>(
    `/roadmaps/${roadmapId}`,
    body,
  );
}
