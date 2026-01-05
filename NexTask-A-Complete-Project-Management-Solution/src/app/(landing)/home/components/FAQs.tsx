import React from 'react';
import { ExpandMore } from '@mui/icons-material';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
  Grid2,
} from '@mui/material';
import { faqs } from '../helpers';

// FAQ component to display a list of frequently asked questions
const FAQs: React.FC = () => {
  return (
    <Box py={8}>
      <Grid2 container justifyContent="center">
        <Grid2 size={{ xs: 12, sm: 10, md: 7 }}>
          <Box textAlign="center" pb={6}>
            <Typography variant="h5" gutterBottom>
              Frequently Asked Questions
            </Typography>
            <Divider>
              <Typography textAlign="center" variant="body2">
                Questions We Hear Most Often
              </Typography>
            </Divider>
          </Box>
          <Box mt={2}>
            {faqs.map(({ q, a }, index) => (
              <Accordion
                key={index}
                elevation={0}
                sx={{
                  border: 'none',
                  bgcolor: (theme) => theme.palette.background.default,
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  aria-controls={`panel${index + 1}-content`}
                  id={`panel${index + 1}-header`}
                >
                  <Typography variant="subtitle1">{q}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="subtitle2">{a}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Grid2>
      </Grid2>
    </Box>
  );
};

export default FAQs;
