import ProjectDetails from '@/components/projects/details/project-details';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  return <ProjectDetails id={id} />;
}
