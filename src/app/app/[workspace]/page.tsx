interface WorkspacePageProps {
  params: Promise<{ workspace: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspace } = await params;
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Workspace: {workspace}</h1>
    </div>
  );
}
