import React from 'react';
import { Typography, Link, Box, useTheme } from '@mui/material';
import NextLink from 'next/link';

export default function Logo() {
  const theme = useTheme();
  return (
    <Link component={NextLink} href={'/'}>
      <Box display="flex" alignItems="center">
        <Box
          px={1.5}
          py={0.5}
          bgcolor={theme.palette.primary.main}
          color={theme.palette.common.white}
          mr={0.5}
          borderRadius={`${theme.shape.borderRadius}px`}
        >
          <Typography variant="h6" component="span" sx={{ color: 'inherit' }}>
            NexT
          </Typography>
        </Box>
        <Typography variant="h6" component="span" color={theme.palette.text.primary}>
          ask
        </Typography>
      </Box>
    </Link>
  );
}
