/** biome-ignore-all lint/performance/noNamespaceImport: <explanation> */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { authClient } from "@/shared/lib/auth-client";
import * as UseCurrentUser from "../../api/get-current-user";
import { UserMenu } from "../user-menu";

vi.mock("@/shared/lib/auth-client", () => ({
  authClient: {
    signOut: vi.fn(),
  },
}));

vi.mock("@tanstack-effect-convex/ui/components/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => (
    <button type="button">{children}</button>
  ),
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuGroup: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick} type="button">
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

describe("UserMenu", () => {
  const mockUser = {
    name: "John Doe",
    email: "john@example.com",
  };

  it("renders user name", () => {
    vi.spyOn(UseCurrentUser, "useCurrentUser").mockReturnValue(mockUser as any);
    render(<UserMenu />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("shows email in dropdown", () => {
    vi.spyOn(UseCurrentUser, "useCurrentUser").mockReturnValue(mockUser as any);
    render(<UserMenu />);

    expect(screen.getByText("john@example.com")).toBeInTheDocument();
  });

  it("calls signOut on click", () => {
    vi.spyOn(UseCurrentUser, "useCurrentUser").mockReturnValue(mockUser as any);
    render(<UserMenu />);

    fireEvent.click(screen.getByText("Sign Out"));

    expect(authClient.signOut).toHaveBeenCalled();
  });
});
