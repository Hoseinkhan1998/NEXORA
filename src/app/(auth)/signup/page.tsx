import { Suspense } from "react";
import type { Metadata } from "next";
import { SignupForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create an account on NEXORA.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md min-h-[420px]" />}>
      <SignupForm />
    </Suspense>
  );
}
