'use client';
import { ReactNode, useState } from 'react';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import SettingsDrawer from '@/components/Header/SettingsDrawer';
import { Box, Container, Fab } from '@mui/material';
import { SettingsOutlined } from '@mui/icons-material';
import { appbarHeight } from '@/utils/constants';

interface MyComponentProps {
  children: ReactNode;
}

const MainLayout: React.FC<MyComponentProps> = ({ children }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <Header />
      <Container
        component="main"
        sx={{
          flexGrow: 1,
          mt: `${appbarHeight * 3}px`,
        }}
        maxWidth="md"
      >
        {children}
      </Container>
      <Footer />
      <Fab
        variant="extended"
        color="primary"
        aria-label="add"
        size="small"
        sx={{
          position: 'fixed',
          top: '13%',
          right: 0,
          borderRadius: (theme) =>
            `${theme.shape.borderRadius}px 0px 0px ${theme.shape.borderRadius}px`,
        }}
        onClick={() => setSettingsOpen(true)}
      >
        <SettingsOutlined />
      </Fab>
      <SettingsDrawer onClose={() => setSettingsOpen(false)} open={settingsOpen} />
    </Box>
  );
};

export default MainLayout;
