/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */

import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, vi } from "vitest";
import * as UseCurrentUser from "../../api/get-current-user";
import { UserMenu } from "../user-menu";

// Mock auth client
vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn(),
  },
}));

describe("UserMenu", () => {
  it("renders user information", () => {
    vi.spyOn(UseCurrentUser, "useCurrentUser").mockReturnValue({
      name: "John Doe",
      email: "john@example.com",
    } as any);

    render(<UserMenu />);

    expect(screen.getByText("John Doe")).toBeTruthy();
    expect(screen.getByText("john@example.com")).toBeTruthy();
  });

  it("calls signOut when button is pressed", () => {
    vi.spyOn(UseCurrentUser, "useCurrentUser").mockReturnValue({
      name: "John Doe",
      email: "john@example.com",
    } as any);

    const { authClient } = require("@/shared/lib/auth-client");

    render(<UserMenu />);

    fireEvent.press(screen.getByText("Sign out"));
    expect(authClient.signOut).toHaveBeenCalled();
  });
});
