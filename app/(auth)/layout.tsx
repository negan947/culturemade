import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - CultureMade",
  description: "Sign in or create an account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen-dvh sm:min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md px-4 py-safe-top pb-safe-bottom sm:py-0">
        {children}
      </div>
    </div>
  );
} 