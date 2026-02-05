import { api } from "@tanstack-effect-convex/backend/src/convex/_generated/api";
import { renderHook } from "@testing-library/react";
import { useQuery } from "convex/react";
import { describe, expect, it, vi } from "vitest";
import { useCurrentUser } from "../get-current-user";

vi.mock("convex/react", () => ({
  useQuery: vi.fn(),
}));

describe("useCurrentUser", () => {
  it("should call useQuery with correct arguments", () => {
    renderHook(() => useCurrentUser());

    expect(useQuery).toHaveBeenCalledWith(api.auth.getCurrentUser);
  });
});
