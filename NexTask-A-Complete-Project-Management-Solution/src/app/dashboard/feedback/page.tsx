'use client';
import FeedbackForm from './components/FeedbackForm';
import PageHeader from '@/components/PageHeader';
import { Button, Paper } from '@mui/material';
import { MailOutline } from '@mui/icons-material';
import { mailtoLink } from './helpers';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '@/redux/selectors';

const Feedback = () => {
  const { data: userInfo } = useSelector(selectCurrentUser);

  const handleNewFeedback = () => {
    // Feedback submission is now handled in the FeedbackForm component
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
        <FeedbackForm userInfo={userInfo} onSubmit={handleNewFeedback} />
      </Paper>
    </>
  );
};

export default Feedback;
