import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  Assessment,
  CaseRecord,
  Priority,
  ReassessmentComparison,
  RiskAnalysis,
  RoadmapItem,
} from "@/types/domain";

export interface CreateReassessmentBody {
  whatChanged: string;
  updatedSituationDetails?: string;
  userNote?: string;
}

export interface CreateReassessmentResult {
  assessment: Assessment;
  case?: CaseRecord;
  analysis: RiskAnalysis;
  priorities: { priorities: Priority[] } | Priority[];
  roadmap: { roadmap: RoadmapItem[] } | RoadmapItem[];
  comparison: ReassessmentComparison;
}

export function createReassessment(caseId: string, body: CreateReassessmentBody) {
  return apiClient.post<ApiSuccessResponse<CreateReassessmentResult>, CreateReassessmentBody>(
    `/cases/${caseId}/reassessments`,
    body,
  );
}

export function fetchReassessments(caseId: string) {
  return apiClient.get<ApiSuccessResponse<Assessment[]>>(`/cases/${caseId}/reassessments`);
}
