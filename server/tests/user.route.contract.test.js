import express from "express";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
const firebase = require("../src/config/firebase");
const userService = require("../src/services/user.service");
const router = require("../src/routes/user.routes");

describe("GET /api/users/me contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the current existing response shape", async () => {
    vi.spyOn(firebase.auth, "verifyIdToken").mockResolvedValue({
      uid: "firebase-1",
    });
    vi.spyOn(userService, "syncUser").mockResolvedValue({
      id: "user-1",
      firebase_uid: "firebase-1",
      email: "user@example.com",
      name: "User",
    });
    const app = express();
    app.use("/api/users", router);

    const response = await request(app)
      .get("/api/users/me")
      .set("Authorization", "Bearer token-123");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      firebaseUser: { uid: "firebase-1" },
      databaseUser: {
        id: "user-1",
        firebase_uid: "firebase-1",
        email: "user@example.com",
        name: "User",
      },
    });
  });
});
