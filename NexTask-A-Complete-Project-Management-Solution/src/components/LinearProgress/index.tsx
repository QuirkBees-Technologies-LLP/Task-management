'use client';
import React, { useEffect, useState } from 'react';
import { Box, LinearProgress as MuiLinearProgress } from '@mui/material';

function LinearProgress() {
  const [loading, setLoading] = useState(false);

  const handleStart = () => setLoading(true);
  const handleComplete = () => setLoading(false);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    handleStart();
    return () => {
      handleComplete();
    };
  }, []);

  useEffect(() => {
    if (loading) {
      setProgress(10);
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          const diff = Math.random() * 10;
          return Math.min(oldProgress + diff, 100);
        });
      }, 500);

      return () => {
        clearInterval(timer);
      };
    }
  }, [loading]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setProgress(100), 300);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  return (
    <>
      {loading && (
        <Box
          sx={{
            width: '100%',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: (theme) => theme.zIndex.drawer + 999,
          }}
        >
          <MuiLinearProgress sx={{ height: '2px' }} variant="determinate" value={progress} />
        </Box>
      )}
    </>
  );
}

export default LinearProgress;
