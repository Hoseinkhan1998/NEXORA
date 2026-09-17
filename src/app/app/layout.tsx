import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/features/auth";

interface AppRootLayoutProps {
  children: ReactNode;
}

export default async function AppRootLayout({ children }: AppRootLayoutProps) {
  const { isAuthenticated } = await getCurrentUser();

  if (!isAuthenticated) {
    redirect("/login");
  }

  return <>{children}</>;
}
