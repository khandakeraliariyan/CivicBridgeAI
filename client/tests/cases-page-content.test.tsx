import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const fetchCases = vi.fn();

vi.mock("@/lib/features", () => ({
  frontendFeatures: {
    enableCaseHistory: true,
  },
}));

vi.mock("@/services/case-service", () => ({
  fetchCases,
}));

describe("CasesPageContent", () => {
  it("renders the authenticated case list", async () => {
    fetchCases.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: "case-1",
            user_id: "user-1",
            title: "Job loss and rent pressure",
            summary: "Housing and income need attention.",
            status: "URGENT",
            main_risk: "HIGH",
            latest_stability_score: 31,
            last_activity_at: "2026-06-20T00:00:00.000Z",
            created_at: "2026-06-18T00:00:00.000Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 8,
          total: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    });

    const { CasesPageContent } = await import(
      "@/components/cases/cases-page-content"
    );

    render(<CasesPageContent />);

    await waitFor(() => {
      expect(screen.getByText("Job loss and rent pressure")).toBeInTheDocument();
    });
    expect(screen.getByText("URGENT")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open Workspace" })).toHaveAttribute(
      "href",
      "/cases/case-1",
    );
  });
});
