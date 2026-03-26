"use client";

import { ReactNode, useEffect } from "react";
import { FullscreenLoader } from "./fullscreen-loader";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth, SignIn, SignUp } from "@clerk/nextjs";
import {
  ConvexReactClient,
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "convex/react";
import { AuthScreen } from "./auth-screen";
import { useState } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function AuthFlow() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-up");

  useEffect(() => {
    // Attach click handler to Clerk's footer action link
    const footerAction = document.querySelector('[data-clerk-footer-action] a, [data-clerk-footer-action] button');
    if (footerAction) {
      const handleClick = (e: Event) => {
        e.preventDefault();
        setMode(mode === "sign-up" ? "sign-in" : "sign-up");
      };
      footerAction.addEventListener('click', handleClick);
      return () => footerAction.removeEventListener('click', handleClick);
    }
  }, [mode]);

  return (
    <AuthScreen>
      {mode === "sign-up" ? (
        <SignUp
          routing="virtual"
          fallbackRedirectUrl="/"
          appearance={{ elements: { footerAction: "" } }}
        />
      ) : (
        <SignIn
          routing="virtual"
          fallbackRedirectUrl="/"
          appearance={{ elements: { footerAction: "" } }}
        />
      )}
    </AuthScreen>
  );
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      appearance={{
        variables: {
          colorWarning: "#71717a",
        },
      }}
    >
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <Authenticated>{children}</Authenticated>
        <Unauthenticated>
          <AuthFlow />
        </Unauthenticated>
        <AuthLoading>
          <FullscreenLoader label="Auth loading..." />
        </AuthLoading>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}