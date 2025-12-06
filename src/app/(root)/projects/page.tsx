'use client';
import { Suspense, useState } from 'react';
import CreateProjectDialog from '@/components/projects/create-project-popup';
import TableSection from '@/components/projects/table-section';
import TableSectionFallback from '@/components/projects/table-section-fallback';

export default function Projects() {
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleProjectCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <section className="space-y-4">
      <div className="flex justify-between">
        <div>
          <h1 className="font-bold text-2xl">Projects</h1>
          <span className="text-muted-foreground">List of all projects</span>
        </div>
        <CreateProjectDialog onProjectCreated={handleProjectCreated} />
      </div>
      <Suspense fallback={<TableSectionFallback />}>
        <TableSection refreshTrigger={refreshTrigger} />
      </Suspense>
    </section>
  );
}
