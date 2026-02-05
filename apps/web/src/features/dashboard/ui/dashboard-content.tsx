import { UserMenu } from "@/features/auth/ui/user-menu";
import { usePrivateData } from "../api/get-private-data";

export function DashboardContent() {
  const privateData = usePrivateData();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>privateData: {privateData?.message}</p>
      <UserMenu />
    </div>
  );
}
