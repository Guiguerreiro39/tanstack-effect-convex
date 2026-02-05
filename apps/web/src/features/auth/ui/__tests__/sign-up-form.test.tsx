import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SignUpForm } from "../sign-up-form";

// Mock dependencies
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signUp: {
      email: vi.fn(),
    },
  },
}));

describe("SignUpForm", () => {
  const mockOnSwitch = vi.fn();

  it("renders form elements", () => {
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />);

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign Up" })).toBeInTheDocument();
  });

  it("calls onSwitchToSignIn", () => {
    render(<SignUpForm onSwitchToSignIn={mockOnSwitch} />);

    fireEvent.click(screen.getByText("Already have an account? Sign In"));
    expect(mockOnSwitch).toHaveBeenCalled();
  });
});
