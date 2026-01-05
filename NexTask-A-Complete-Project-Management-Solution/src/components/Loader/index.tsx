'use client';

import React from 'react';
import { Box, styled } from '@mui/material';

const LoaderWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  background: theme.palette.background.default,
  '& .loader': {
    width: 45,
    aspectRatio: '1',
    borderRadius: theme.shape.borderRadius,
    '--c': `no-repeat linear-gradient(${theme.palette.primary.main} 0 0)`,
    background: 'var(--c) 0% 50%, var(--c) 50% 50%, var(--c) 100% 50%',
    backgroundSize: '20% 100%',
    animation: 'l1 1s infinite linear',
  },
  '@keyframes l1': {
    '0%': { backgroundSize: '20% 100%, 20% 100%, 20% 100%' },
    '33%': { backgroundSize: '20% 10%, 20% 100%, 20% 100%' },
    '50%': { backgroundSize: '20% 100%, 20% 10%, 20% 100%' },
    '66%': { backgroundSize: '20% 100%, 20% 100%, 20% 10%' },
    '100%': { backgroundSize: '20% 100%, 20% 100%, 20% 100%' },
  },
}));

const Loader = () => {
  return (
    <LoaderWrapper>
      <div className="loader"></div>
    </LoaderWrapper>
  );
};

export default Loader;
