'use client';
import { CircularProgress, Box } from '@mui/material';

const Spinner = ({ inSection = false }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: inSection ? '100%' : '100vh',
        width: inSection ? '100%' : '100vw',
        position: inSection ? 'initial' : 'fixed',
        top: 0,
        left: 0,
        backgroundColor: (theme) => (inSection ? 'transparent' : theme.palette.background.paper),
        zIndex: (theme) => theme.zIndex.drawer + 10,
      }}
    >
      <CircularProgress color="primary" />
    </Box>
  );
};

export default Spinner;
