import type { ImgHTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: ImgHTMLAttributes<HTMLImageElement>) => <img {...props} alt={props.alt || ""} />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/lib/features", () => ({
  frontendFeatures: {
    enableCaseHistory: true,
  },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    signOutUser: vi.fn(),
  }),
}));

describe("feature navigation visibility", () => {
  it("shows the Cases navigation item when case history is enabled", async () => {
    const { Sidebar } = await import("@/components/layout/sidebar");
    const { MobileNav } = await import("@/components/layout/mobile-nav");

    render(
      <>
        <Sidebar />
        <MobileNav open onClose={vi.fn()} />
      </>,
    );

    expect(screen.getAllByText("Cases").length).toBeGreaterThan(0);
  });
});
