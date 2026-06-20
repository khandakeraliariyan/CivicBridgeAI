"use client";

import Link from "next/link";

import { InteractiveRoadmap } from "@/components/roadmap/interactive-roadmap";
import { EmptyState } from "@/components/ui/empty-state";
import { useAssessmentWorkspace } from "@/hooks/use-assessment-workspace";
import { frontendFeatures } from "@/lib/features";

export default function RoadmapPage() {
  const { selectedCaseId, updateRoadmap, workspace, workspaceReady } = useAssessmentWorkspace();

  if (!workspaceReady) {
    return null;
  }

  if (!workspace) {
    return (
      <EmptyState
        title="No roadmap yet"
        message="Start a case to generate a step-by-step roadmap tailored to your situation."
        action={
          <Link
            href="/assessments/new"
            className="inline-flex rounded-[12px] bg-[#173b72] px-4 py-2.5 font-semibold text-white"
          >
            Start New Case
          </Link>
        }
      />
    );
  }

  const taskProgressAvailable =
    frontendFeatures.enableTaskProgress &&
    workspace.roadmap.every((item) => Boolean(item.id));

  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
        <h2 className="font-heading text-[30px] font-bold tracking-[-0.04em] text-[#173b72]">
          Case Roadmap
        </h2>
        <p className="mt-3 max-w-3xl text-[15px] leading-[1.8] text-[#62728f]">
          Follow the active case plan in order, update progress, and keep the next steps grounded in the latest case status.
        </p>
        {selectedCaseId ? (
          <Link
            href={`/cases/${selectedCaseId}`}
            className="mt-4 inline-flex rounded-[12px] border border-[#d9deea] bg-white px-4 py-2.5 font-semibold text-[#173b72]"
          >
            Back To Case Workspace
          </Link>
        ) : null}
      </section>

      {taskProgressAvailable ? (
        <InteractiveRoadmap
          roadmap={workspace.roadmap}
          onRoadmapChange={updateRoadmap}
        />
      ) : (
        <section className="rounded-[20px] border border-[#dbe4f4] bg-white p-6 shadow-[0_8px_20px_-18px_rgba(17,43,89,0.3)]">
          <div className="space-y-5">
            {workspace.roadmap.map((item, index) => (
              <div key={`${item.timeline}-${item.task}-${index}`} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8f0ff] text-[13px] font-semibold text-[#173b72]">
                    {index + 1}
                  </div>
                  {index < workspace.roadmap.length - 1 ? (
                    <div className="mt-2 h-14 w-px bg-[#dbe3f1]" />
                  ) : null}
                </div>
                <div className="rounded-[16px] border border-[#e6ebf4] bg-[#fbfcff] px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7b8aa3]">
                    {item.timeline}
                  </p>
                  <p className="mt-2 font-heading text-[20px] font-bold text-[#173b72]">
                    {item.task}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
