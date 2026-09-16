import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-sm p-6 text-center">
      <h1 className="text-xl font-semibold">Log In</h1>
    </div>
  );
}
