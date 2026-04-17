/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */

import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, vi } from "vitest";
import { SignInForm } from "../sign-in-form";

// Mock dependencies
vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
}));

describe("SignInForm", () => {
  it("renders form elements", () => {
    render(<SignInForm />);

    expect(screen.getByText("Email")).toBeTruthy();
    expect(screen.getByText("Password")).toBeTruthy();
    expect(screen.getByText("Sign In")).toBeTruthy();
  });

  it("shows validation error for invalid email", async () => {
    render(<SignInForm />);

    fireEvent.changeText(
      screen.getByPlaceholderText("you@example.com"),
      "invalid"
    );
    fireEvent.press(screen.getByText("Sign In"));

    expect(await screen.findByText("Invalid email address")).toBeTruthy();
  });
});
