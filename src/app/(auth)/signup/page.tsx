import type { Metadata } from "next";
import { SignupForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create an account on NEXORA.",
};

export default function SignupPage() {
  return <SignupForm />;
}
