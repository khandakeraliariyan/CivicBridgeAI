"use client";

import { useParams } from "next/navigation";

import { CaseDetailPageContent } from "@/components/cases/case-detail-page-content";

function normalizeCaseId(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default function CaseDetailPage() {
  const params = useParams<{ caseId?: string | string[] }>();
  const caseId = normalizeCaseId(params.caseId);

  return <CaseDetailPageContent caseId={caseId} />;
}
