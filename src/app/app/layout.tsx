import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, InactivityTracker } from "@/features/auth";

interface AppRootLayoutProps {
  children: ReactNode;
}

export default async function AppRootLayout({ children }: AppRootLayoutProps) {
  const { isAuthenticated, profile } = await getCurrentUser();

  if (!isAuthenticated || !profile) {
    redirect("/login");
  }

  return (
    <>
      <InactivityTracker />
      {children}
    </>
  );
}
