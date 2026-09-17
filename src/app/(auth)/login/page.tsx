import type { Metadata } from "next";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your NEXORA workspace.",
};

export default function LoginPage() {
  return <LoginForm />;
}
