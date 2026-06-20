"use client";

import { usePathname } from "next/navigation";
import { UserMenu } from "@/components/layout/user-menu";

const routeTitles: Array<{
  route: string;
  title: string;
  subtitle: string;
}> = [
  {
    route: "/cases/",
    title: "Case Workspace",
    subtitle: "Work one case across summary, tasks, resources, progress, and notes.",
  },
  {
    route: "/dashboard",
    title: "Overview",
    subtitle: "Review the currently selected case and the next actions that matter most.",
  },
  {
    route: "/assessments/new",
    title: "Start New Case",
    subtitle: "Describe the situation and open a full case workspace.",
  },
  {
    route: "/cases",
    title: "Cases",
    subtitle: "Manage active, resolved, and archived case workspaces.",
  },
  {
    route: "/roadmap",
    title: "Roadmap",
    subtitle: "Review the selected case action plan and update next steps.",
  },
  {
    route: "/resources",
    title: "Resources",
    subtitle: "Review matched support options and tracked case outreach.",
  },
  {
    route: "/progress",
    title: "Progress",
    subtitle: "Track progress across the selected case, not just one snapshot.",
  },
  {
    route: "/settings",
    title: "Settings",
    subtitle: "View your Civic Bridge AI profile and account details.",
  },
];

export function TopHeader({
  menuButton,
}: {
  menuButton: React.ReactNode;
}) {
  const pathname = usePathname();
  const routeMeta = routeTitles.find(({ route }) => pathname.startsWith(route)) ?? {
    title: "Civic Bridge AI",
    subtitle: "Personalized support planning and guided next steps.",
  };

  return (
    <header className="border-b border-[#d9deea] bg-[#fdfdff] px-4 py-4 md:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {menuButton}
          <div className="min-w-0">
            <h1 className="truncate font-heading text-[2rem] font-bold text-[#0d3366]">
              {routeMeta.title}
            </h1>
            <p className="truncate text-sm text-[#7c879e]">
              {routeMeta.subtitle}
            </p>
          </div>
        </div>

        <UserMenu />
      </div>
    </header>
  );
}
