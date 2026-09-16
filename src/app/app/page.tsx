import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "App",
};

export default function AppIndexPage() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Workspace Overview</h1>
    </div>
  );
}
