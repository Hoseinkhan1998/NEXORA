import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/features/workspaces";
import { getWorkspaceAnalyticsData, AnalyticsDashboard } from "@/features/analytics";

interface AnalyticsPageProps {
  params: Promise<{ workspace: string }>;
}

export async function generateMetadata({ params }: AnalyticsPageProps): Promise<Metadata> {
  const { workspace: slug } = await params;
  const ws = await getWorkspaceBySlug(slug);

  if (!ws) {
    return {
      title: "Analytics | NEXORA",
    };
  }

  return {
    title: `Analytics — ${ws.name} | NEXORA`,
    description: `Real-time analytics and telemetry for ${ws.name}`,
  };
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { workspace: slug } = await params;

  const data = await getWorkspaceAnalyticsData(slug);

  if (!data) {
    notFound();
  }

  return <AnalyticsDashboard data={data} />;
}
