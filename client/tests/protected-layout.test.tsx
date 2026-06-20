import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    replace,
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    status: "unauthenticated",
    isFirebaseReady: true,
  }),
}));

vi.mock("@/components/layout/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-shell">{children}</div>
  ),
}));

describe("ProtectedLayout", () => {
  it("redirects unauthenticated users to login", async () => {
    const ProtectedLayout = (await import("@/app/(protected)/layout")).default;

    render(
      <ProtectedLayout>
        <div>Protected content</div>
      </ProtectedLayout>,
    );

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login?next=%2Fdashboard");
    });
  });
});
