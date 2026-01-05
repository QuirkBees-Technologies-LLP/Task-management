'use client';
import FeedbackForm from './components/FeedbackForm';
import PageHeader from '@/components/PageHeader';
import { Button, Paper } from '@mui/material';
import { MailOutline } from '@mui/icons-material';
import { mailtoLink } from './helpers';
import { enqueueSnackbar } from 'notistack';

const Feedback = () => {
  const handleNewFeedback = () => {
    enqueueSnackbar('Feedback submitted', { variant: 'success' });
  };

  return (
    <>
      <PageHeader
        title="Submit Feedback"
        action={
          <a href={mailtoLink}>
            <Button startIcon={<MailOutline />} variant="outlined">
              Contact Support
            </Button>
          </a>
        }
      />
      <Paper sx={{ p: 2 }}>
        <FeedbackForm onSubmit={handleNewFeedback} />
      </Paper>
    </>
  );
};

export default Feedback;
