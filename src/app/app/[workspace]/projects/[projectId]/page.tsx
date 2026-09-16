interface ProjectDetailPageProps {
  params: Promise<{ workspace: string; projectId: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { workspace, projectId } = await params;
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">
        Project {projectId} ({workspace})
      </h1>
    </div>
  );
}
