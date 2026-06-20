import { apiClient } from "@/lib/api-client";
import type { ApiSuccessResponse } from "@/types/api";
import type {
  ApplicationAssistance,
  EligibilityGuidance,
  ResourceInteraction,
} from "@/types/domain";

export interface CreateResourceInteractionBody {
  resourceId: string;
  status?: "SAVED" | "CONTACTED";
}

export interface UpdateResourceInteractionBody {
  status?: "SAVED" | "CONTACTED" | "WAITING_FOR_RESPONSE" | "COMPLETED" | "REJECTED";
  followUpAt?: string | null;
  responseNote?: string | null;
  applicationReference?: string | null;
}

export function fetchResourceInteractions(caseId: string) {
  return apiClient.get<ApiSuccessResponse<ResourceInteraction[]>>(
    `/cases/${caseId}/resource-interactions`,
  );
}

export function createResourceInteraction(
  caseId: string,
  body: CreateResourceInteractionBody,
) {
  return apiClient.post<ApiSuccessResponse<ResourceInteraction>, CreateResourceInteractionBody>(
    `/cases/${caseId}/resource-interactions`,
    body,
  );
}

export function updateResourceInteraction(
  interactionId: string,
  body: UpdateResourceInteractionBody,
) {
  return apiClient.patch<ApiSuccessResponse<ResourceInteraction>, UpdateResourceInteractionBody>(
    `/resource-interactions/${interactionId}`,
    body,
  );
}

export function estimateEligibility(caseId: string, resourceId: string) {
  return apiClient.post<ApiSuccessResponse<EligibilityGuidance>, Record<string, never>>(
    `/cases/${caseId}/resources/${resourceId}/eligibility`,
    {},
  );
}

export function generateApplicationAssistance(caseId: string, resourceId: string) {
  return apiClient.post<ApiSuccessResponse<ApplicationAssistance>, Record<string, never>>(
    `/cases/${caseId}/resources/${resourceId}/application-assistance`,
    {},
  );
}
