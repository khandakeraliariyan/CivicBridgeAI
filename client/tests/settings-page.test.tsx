import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const signOutUser = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    profile: {
      id: "profile-1",
      name: "Alex Mercer",
      email: "alex@example.com",
      firebase_uid: "firebase-1",
    },
    firebaseUser: {
      displayName: "Alex Mercer",
      email: "alex@example.com",
    },
    signOutUser,
  }),
}));

vi.mock("@/hooks/use-assessment-workspace", () => ({
  useAssessmentWorkspace: () => ({
    selectedCaseId: "case-1",
    savedAt: "2026-06-20T00:00:00.000Z",
  }),
}));

vi.mock("@/lib/feedback", () => ({
  notify: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SettingsPage", () => {
  it("shows meaningful account, consent, and cache details", async () => {
    window.localStorage.setItem("civicbridge.ai-consent", "accepted");

    const SettingsPage = (await import("@/app/(protected)/settings/page")).default;

    render(<SettingsPage />);

    expect(screen.getByText("Account Settings")).toBeInTheDocument();
    expect(screen.getByText("Accepted on this browser")).toBeInTheDocument();
    expect(screen.getByText("Open Case History")).toHaveAttribute(
      "href",
      "/cases",
    );
    expect(screen.getByRole("button", { name: "Sign Out" })).toBeInTheDocument();
  });
});
