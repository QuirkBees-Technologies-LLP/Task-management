'use client';
import React from 'react';
import { Typography, Box, Link, Grid2, useTheme, useMediaQuery, Button } from '@mui/material';
import NextLink from 'next/link';
import { KeyboardReturnOutlined } from '@mui/icons-material';
import Image from 'next/image';
import Header from '@/components/Header';

const Custom404 = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <>
      <Header isAuthHeader />

      <>
        <Box textAlign="center">
          <Image
            src="/images/not-found.png"
            alt="no-found"
            width={1180}
            height={1180}
            style={{ width: '30%', height: '30%' }}
          />
          <Box mb={2}>
            <Grid2 container justifyContent="center">
              <Grid2 size={{ xs: 12, sm: 12, md: 9 }}>
                <Box sx={{ mt: { xs: 2, md: 4 } }} textAlign="center">
                  <Typography variant={isSmallScreen ? 'caption' : 'body1'}>
                    Oops! Page not found
                  </Typography>
                </Box>
              </Grid2>
            </Grid2>
          </Box>
          <Box>
            <Link component={NextLink} href="/" underline="none">
              <Button startIcon={<KeyboardReturnOutlined />} variant="contained">
                Return to Home
              </Button>
            </Link>
          </Box>
        </Box>
      </>
    </>
  );
};

export default Custom404;
