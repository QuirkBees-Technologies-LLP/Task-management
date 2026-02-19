'use client';

import PageHeader from '@/components/PageHeader';
import FeedbackForm from './components/FeedbackForm';
import { Box, Grid, TextField, Typography } from '@mui/material';
import { Search, SupportAgent } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Feedback = () => {
  const { data: userInfo } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);

  // Check if user is admin (Admin role or Superuser)
  const isAdmin = userInfo?.role === 'Admin' || isSuperUser;

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Loading tickets for user:', userInfo);
      console.log('User role:', userInfo?.role);
      console.log('Is superuser:', isSuperUser);
      console.log('Is admin:', isAdmin);
      const response = await axios.get('/api/support?limit=50');
      console.log('Support API response:', response.data);
      if (response.data?.success && Array.isArray(response.data.tickets)) {
        setTickets(response.data.tickets);
      } else if (Array.isArray(response.data)) {
        setTickets(response.data);
      } else {
        setTickets([]);
      }
    } catch (error: any) {
      console.error('Error loading support tickets:', error);
      console.error('Error response:', error.response);
      setError(error.response?.data?.error || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadTickets();
    }
  }, [isAdmin]);

  return (
    <>
      <Box>
        {isAdmin ? (
          <>
            {loading && <div>Loading tickets...</div>}
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            {!loading && !error && tickets.length === 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '400px',
                  textAlign: 'center',
                  padding: 4,
                }}
              >
                <SupportAgent
                  sx={{
                    fontSize: 80,
                    color: (theme) => theme.palette.mode === 'dark' 
                      ? theme.palette.text.secondary 
                      : theme.palette.grey[400],
                    mb: 2,
                  }}
                />
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: (theme) => theme.palette.text.primary,
                  }}
                >
                  No Support Tickets Yet
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: (theme) => theme.palette.text.secondary,
                    maxWidth: '500px',
                  }}
                >
                  There are currently no support tickets in the system. New tickets will appear here once users submit support requests.
                </Typography>
              </Box>
            )}
            {!loading && !error && tickets.length > 0 && (
              <Grid container spacing={2}>
                {tickets.map((ticket) => {
                  const contact = ticket.contact || {};
                  const name =
                    `${contact.firstName || ''} ${contact.lastName || ''}`.trim() ||
                    contact.email ||
                    'User';
                  const createdAt = ticket.createdAt ? new Date(ticket.createdAt) : null;
                  const timeLabel = createdAt ? createdAt.toLocaleString() : '';

                  const priorityLabel =
                    ticket.priority === 'high'
                      ? 'High Priority'
                      : ticket.priority === 'low'
                      ? 'Low Priority'
                      : 'Medium Priority';

                  return (
                    <Grid item xs={12} sm={6} lg={4} xl={3} key={ticket._id}>
                      <FeedbackForm
                        ticketId={ticket._id}
                        name={name}
                        time={timeLabel}
                        subject={ticket.subject}
                        message={ticket.description}
                        status={ticket.status || 'Open'}
                        priority={priorityLabel}
                        department={ticket.category || 'General'}
                        newticket={ticket.status === 'open' && !ticket.read ? 'New Ticket' : undefined}
                        attachments={ticket.attachments || []}
                        onReload={loadTickets}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </>
        ) : (
          <FeedbackForm />
        )}
      </Box>
    </>
  );
};

export default Feedback;
