interface SettingsPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace } = await params;
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Settings ({workspace})</h1>
    </div>
  );
}
