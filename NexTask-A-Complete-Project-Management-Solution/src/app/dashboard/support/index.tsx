import FeedbackForm from './components/FeedbackForm';
import PageHeader from '@/components/PageHeader';
import { Box, Grid } from '@mui/material';

const Feedback = () => {
  return (
    <>
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} lg={4} xl={3}>
            <FeedbackForm
              name="Emayila Sidorshina"
              time="5 mins ago"
              message="Payment deducted but invoice still shows unpaid. Need..."
              avatar="https://i.pravatar.cc/150?img=47"
              status="Open"
              priority="High Priority"
              department="Sales Department"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={4} xl={3}>
            <FeedbackForm
              name="Emayila Sidorshina"
              time="5 mins ago"
              message="Payment deducted but invoice still shows unpaid. Need..."
              avatar="https://i.pravatar.cc/150?img=47"
              status="Open"
              priority="High Priority"
              department="Sales Department"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={4} xl={3}>
            <FeedbackForm
              name="Emayila Sidorshina"
              time="5 mins ago"
              message="Payment deducted but invoice still shows unpaid. Need..."
              avatar="https://i.pravatar.cc/150?img=47"
              status="Open"
              priority="High Priority"
              department="Sales Department"
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={4} xl={3}>
            <FeedbackForm
              name="Emayila Sidorshina"
              time="5 mins ago"
              message="Payment deducted but invoice still shows unpaid. Need..."
              avatar="https://i.pravatar.cc/150?img=47"
              status="Open"
              priority="High Priority"
              department="Sales Department"
            />
          </Grid>
        </Grid>
      </Box>
      {/* <FeedbackForm /> */}
    </>
  );
};

export default Feedback;
