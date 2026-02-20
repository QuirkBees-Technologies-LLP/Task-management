import React from 'react';
import { Typography, Link, Box, useTheme } from '@mui/material';
import NextLink from 'next/link';

export default function Logo() {
  const theme = useTheme();
  return (
    <Link component={NextLink} href={'/'}>
      <img
        src={
          theme.palette.mode === "dark"
            ? "/images/logo_white.png"
            : "/images/logo_dark.png"
        }
        height={28}
        alt="OpsDeck Logo"
      />
    </Link>
  );
}
