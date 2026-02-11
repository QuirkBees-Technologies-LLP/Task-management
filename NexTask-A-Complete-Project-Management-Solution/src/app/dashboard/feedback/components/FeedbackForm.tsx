import React, { useState } from 'react';
import { TextField, Button, Box } from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';

const FeedbackForm = ({ userInfo, onSubmit }) => {
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      enqueueSnackbar('Enter feedback message', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const ticketData = {
        subject: 'User Feedback',
        description: feedback,
        category: 'feedback',
        priority: 'medium',
        contact: {
          firstName: userInfo?.firstName || '',
          lastName: userInfo?.lastName || '',
          email: userInfo?.email || '',
        },
      };

      const response = await axios.post('/api/support', ticketData);

      if (response.data.success) {
        enqueueSnackbar('Feedback submitted successfully', { variant: 'success' });
        setFeedback('');
        onSubmit();
      } else {
        throw new Error('Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      enqueueSnackbar('Failed to submit feedback. Please try again.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
      <TextField
        label="Your Feedback"
        variant="outlined"
        fullWidth
        multiline
        rows={4}
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        sx={{ my: 2 }}
        disabled={loading}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        disabled={loading}
      >
        {loading ? 'Submitting...' : 'Submit'}
      </Button>
    </Box>
  );
};

export default FeedbackForm;
