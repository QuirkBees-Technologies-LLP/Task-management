'use client';

import React from 'react';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/redux/selectors';
import { selectSuperuser } from '@/redux/selectors';
import ProfileSettings from './components/Profile';
import CompanySettings from './components/CompanySettings';
import BankingDetails from './components/BankingDetails';
import SubscriptionSettings from './components/SubscriptionSettings';

const Settings: React.FC = () => {
  const { data: currentUser } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = currentUser?.role === 'Admin' || isSuperUser;

  return (
    <Box>
      <ProfileSettings />
      {/* Only show Company Settings and Banking Details for Admin/SuperUser */}
      {isAdmin && (
        <>
          <SubscriptionSettings />
          <CompanySettings />
          <BankingDetails />
        </>
      )}
    </Box>
  );
};

export default Settings;
