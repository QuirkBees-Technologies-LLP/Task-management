'use client';
import React from 'react';
import { Divider, Paper } from '@mui/material';
import Notifications from './components/NotificationList';
import CardHeader from '@/components/CardHeader';

export default function Client() {
  return (
    <>
      <Paper>
        <CardHeader title="Notifications" />
        <Divider />
        <Notifications />
      </Paper>
    </>
  );
}
