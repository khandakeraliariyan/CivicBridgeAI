import type { CaseStatus } from "@/types/domain";
import { cn } from "@/lib/utils";

const statusClasses: Record<CaseStatus, string> = {
  ACTIVE: "bg-[#eef4ff] text-[#173b72]",
  URGENT: "bg-[#fdebe8] text-[#bf4a34]",
  STABLE: "bg-[#eaf7f1] text-[#2e7a58]",
  RESOLVED: "bg-[#eef2fb] text-[#5f6f8a]",
  ARCHIVED: "bg-[#f2f4f8] text-[#7c879e]",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
        statusClasses[status],
      )}
    >
      {status}
    </span>
  );
}
