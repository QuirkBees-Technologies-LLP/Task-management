'use client';

import React, { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';

// This legacy route (`/dashboard/projects/[slug]`) previously rendered a
// fully hardcoded demo page. It is now kept only as a lightweight redirect
// into the real, data-driven Project Details page at `/projects/[id]/full-details`.

export default function LegacyProjectDetailsRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string | undefined;

  useEffect(() => {
    if (!slug) return;
    // Redirect to the new canonical project details page
    router.replace(`/projects/${slug}/full-details`);
  }, [slug, router]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
      <CircularProgress />
    </Box>
  );
}
