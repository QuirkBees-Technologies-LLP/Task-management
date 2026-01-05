'use client';

import React from 'react';
import { Box } from '@mui/material';
import ProfileSettings from './components/Profile';
import CompanySettings from './components/CompanySettings';
import BankingDetails from './components/BankingDetails';

const Settings: React.FC = () => {
  return (
    <Box>
      <ProfileSettings />
      <CompanySettings />
      <BankingDetails />
    </Box>
  );
};

export default Settings;
