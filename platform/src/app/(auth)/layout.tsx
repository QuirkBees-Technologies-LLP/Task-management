'use client';
import React, { useEffect } from 'react';
import { Box, Grid2, Paper } from '@mui/material';
import Header from '@/components/Header';
import { accessTokenKey, appbarHeight } from '@/utils/constants';
import { usePathname, useRouter } from 'next/navigation';
import { isTokenExpired, safeLocalStorageGet } from '@/utils/helpers';

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = safeLocalStorageGet(accessTokenKey);

    // Redirect to projects if the user is logged in and not on the change-password route
    if (token && !isTokenExpired(token) && pathname !== '/change-password') {
      router.push('/dashboard/projects'); // Redirect to projects instead of dashboard
    }
  }, [router, pathname]);

  return (
    <>
      <Header isAuthHeader />
      <Grid2
        container
        component="main"
        justifyContent={'center'}
        alignItems={'center'}
        sx={{ height: '100vh', pt: `${appbarHeight}px` }}
      >
        <Grid2 size={{ xs: 12, sm: 8, md: 6, lg: 5 }} mx={1}>
          <Box maxWidth={500} mx={'auto'} my={'auto'} component={Paper}>
            {children}
          </Box>
        </Grid2>
      </Grid2>
    </>
  );
}
