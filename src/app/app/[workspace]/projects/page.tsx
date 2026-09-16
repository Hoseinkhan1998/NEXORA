interface ProjectsPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function ProjectsPage({ params }: ProjectsPageProps) {
  const { workspace } = await params;
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Projects ({workspace})</h1>
    </div>
  );
}
