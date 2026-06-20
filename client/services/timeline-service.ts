import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { TimelineEvent } from "@/types/domain";

export interface TimelineListResult {
  items: TimelineEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function fetchCaseTimeline(caseId: string, page = 1, limit = 10) {
  return apiClient.get<ApiSuccessResponse<TimelineListResult>>(
    `/cases/${caseId}/timeline?page=${page}&limit=${limit}`,
  );
}

export function createTimelineNote(caseId: string, note: string) {
  return apiClient.post<ApiSuccessResponse<TimelineEvent>, { note: string }>(
    `/cases/${caseId}/timeline-notes`,
    { note },
  );
}
