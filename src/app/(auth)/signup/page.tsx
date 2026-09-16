import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function SignupPage() {
  return (
    <div className="w-full max-w-sm p-6 text-center">
      <h1 className="text-xl font-semibold">Sign Up</h1>
    </div>
  );
}
