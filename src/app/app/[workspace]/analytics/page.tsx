interface AnalyticsPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { workspace } = await params;
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Analytics ({workspace})</h1>
    </div>
  );
}
