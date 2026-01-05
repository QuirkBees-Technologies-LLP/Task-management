import FeedbackForm from './components/FeedbackForm';
import PageHeader from '@/components/PageHeader';
import { Paper } from '@mui/material';

const Feedback = () => {
  return (
    <>
      <PageHeader title="Contact Support" />
      <Paper sx={{ p: 2 }}>
        <FeedbackForm />
      </Paper>
    </>
  );
};

export default Feedback;
