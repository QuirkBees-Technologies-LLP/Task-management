'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ProjectsPage: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect /projects to /dashboard/projects
    router.replace('/dashboard/projects');
  }, [router]);

  return null;
};

export default ProjectsPage;
