import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignInForm } from "../sign-in-form";

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
}));

describe("SignInForm", () => {
  const mockOnSwitch = vi.fn();

  it("renders form elements", () => {
    render(<SignInForm onSwitchToSignUp={mockOnSwitch} />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("calls onSwitchToSignUp", () => {
    render(<SignInForm onSwitchToSignUp={mockOnSwitch} />);

    fireEvent.click(screen.getByText("Need an account? Sign Up"));
    expect(mockOnSwitch).toHaveBeenCalled();
  });
});
