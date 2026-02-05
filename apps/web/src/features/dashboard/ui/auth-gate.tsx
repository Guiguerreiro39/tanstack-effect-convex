import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import { useState } from "react";
import { SignInForm } from "@/features/auth/ui/sign-in-form";
import { SignUpForm } from "@/features/auth/ui/sign-up-form";
import { DashboardContent } from "./dashboard-content";

export function AuthGate() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <>
      <Authenticated>
        <DashboardContent />
      </Authenticated>
      <Unauthenticated>
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </Unauthenticated>
      <AuthLoading>
        <div>Loading...</div>
      </AuthLoading>
    </>
  );
}
