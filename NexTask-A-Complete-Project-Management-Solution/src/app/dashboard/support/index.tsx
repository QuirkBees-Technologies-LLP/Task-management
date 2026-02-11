'use client';

import PageHeader from '@/components/PageHeader';
import FeedbackForm from './components/FeedbackForm';
import { Box, Grid, TextField } from '@mui/material';
import { Search } from '@mui/icons-material';
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
      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          padding: "16px 24px",
          borderRadius: "8px",
          mb: 3,
        }}
      >
        <PageHeader                      
          title="Support"
          className="top_header"
          sx={{ mb: "0 !important" }}
          action={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                width: "100%",
                gap: 2,
              }}
            >
              {/* LEFT SIDE SEARCH BAR */}
              <TextField
                size="small"
                placeholder="Search tickets.."
                type="search"
                InputProps={{
                  startAdornment: <Search fontSize="small" />,
                }}
                sx={{
                  width: { xs: "unset", lg: "520px" },
                  maxWidth: "100%",
                  borderRadius: "6px",

                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.background.default
                      : "#F9FAFC",

                  "& .MuiOutlinedInput-root": {
                    gap: 1,
                    color: (theme) => theme.palette.text.primary,

                    "& fieldset": {
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    },

                    "&:hover fieldset": {
                      borderColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? theme.palette.primary.main
                          : "#CBD5E1",
                    },
                  },
                }}
              />
            </Box>
          }
        />
      </Box>
      <Box>
        {isAdmin ? (
          <>
            {loading && <div>Loading tickets...</div>}
            {error && <div style={{ color: 'red' }}>Error: {error}</div>}
            {!loading && !error && tickets.length === 0 && (
              <div></div>
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
