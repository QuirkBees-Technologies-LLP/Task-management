import React from 'react';
import ProfileSettings from './components/Profile';

export const metadata = {
  title: 'Settings - NexTask',
  description: 'Manage your profile settings',
};

const Settings: React.FC = () => {
  return <ProfileSettings />;
};

export default Settings;
