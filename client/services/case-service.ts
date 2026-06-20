import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type { CaseStatus, CaseRecord, CaseWorkspacePayload } from "@/types/domain";

export interface CaseListQuery {
  page?: number;
  limit?: number;
  status?: CaseStatus;
  archived?: boolean;
  sort?: "updated_desc" | "updated_asc" | "created_desc" | "created_asc";
}

export interface CaseListResult {
  items: CaseRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

function buildQuery(query: CaseListQuery) {
  const search = new URLSearchParams();

  if (query.page) {
    search.set("page", String(query.page));
  }

  if (query.limit) {
    search.set("limit", String(query.limit));
  }

  if (query.status) {
    search.set("status", query.status);
  }

  if (query.archived !== undefined) {
    search.set("archived", String(query.archived));
  }

  if (query.sort) {
    search.set("sort", query.sort);
  }

  const serialized = search.toString();
  return serialized ? `?${serialized}` : "";
}

export function fetchCases(query: CaseListQuery = {}) {
  return apiClient.get<ApiSuccessResponse<CaseListResult>>(
    `/cases${buildQuery(query)}`,
  );
}

export function fetchCaseDetail(caseId: string) {
  return apiClient.get<ApiSuccessResponse<CaseWorkspacePayload>>(`/cases/${caseId}`);
}

export interface UpdateCaseBody {
  title?: string;
  status?: CaseStatus;
}

export function updateCase(caseId: string, body: UpdateCaseBody) {
  return apiClient.patch<ApiSuccessResponse<CaseRecord>, UpdateCaseBody>(
    `/cases/${caseId}`,
    body,
  );
}
