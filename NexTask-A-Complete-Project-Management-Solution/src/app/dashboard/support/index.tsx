'use client';

import PageHeader from '@/components/PageHeader';
import FeedbackForm from './components/FeedbackForm';
import { Box, Grid, TextField } from '@mui/material';
import { Search } from '@mui/icons-material';

const Feedback = () => {
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
