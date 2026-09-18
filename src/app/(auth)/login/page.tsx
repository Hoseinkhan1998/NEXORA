import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your NEXORA workspace.",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md min-h-[380px]" />}>
      <LoginForm />
    </Suspense>
  );
}
