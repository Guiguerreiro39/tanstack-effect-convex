import { authClient } from "@/shared/lib/auth-client";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { useCurrentUser } from "../api/get-current-user";

export function UserMenu() {
  const user = useCurrentUser();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{user?.name}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card">
        <DropdownMenuGroup>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{user?.email}</DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    location.reload();
                  },
                },
              });
            }}
            variant="destructive"
          >
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
