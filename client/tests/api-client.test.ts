import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("apiClient", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("throws Unauthorized when no Firebase user is available", async () => {
    vi.doMock("@/lib/firebase", () => ({
      isFirebaseConfigured: true,
      firebaseAuth: {
        currentUser: null,
      },
    }));

    const { apiClient, ApiError } = await import("@/lib/api-client");

    await expect(apiClient.get("/users/me")).rejects.toBeInstanceOf(ApiError);
    await expect(apiClient.get("/users/me")).rejects.toMatchObject({
      status: 401,
      message: "Unauthorized",
    });
  });

  it("attaches the bearer token header", async () => {
    vi.doMock("@/lib/firebase", () => ({
      isFirebaseConfigured: true,
      firebaseAuth: {
        currentUser: {
          getIdToken: vi.fn().mockResolvedValue("token-123"),
        },
      },
    }));
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: () => "application/json",
      },
      json: async () => ({ success: true }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { apiClient } = await import("@/lib/api-client");

    await apiClient.get("/users/me");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:5000/api/users/me",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      }),
    );
  });
});
