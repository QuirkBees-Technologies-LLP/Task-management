'use client';
import React from 'react';
import ContactForm from '../home/components/ContactForm';
import AnimatedComponent from '@/components/Animated';
import { Box, Grid2, Typography, useMediaQuery, useTheme } from '@mui/material';
import { gradientAnimation } from '../home/helpers';

export default function ContactUs() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <>
      <Box>
        <Grid2 container justifyContent="center">
          <Grid2 size={{ xs: 12, sm: 12, md: 9 }}>
            <Box sx={{ mt: { xs: 2, md: 4 } }} textAlign="center">
              <AnimatedComponent animationType="slideLeft">
                <Typography
                  variant="h1"
                  sx={{
                    fontSize: { xs: '8vw', md: '4.5rem' },
                    background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.light})`,
                    backgroundSize: '200% 200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: `${gradientAnimation} 4s ease infinite`,
                    lineHeight: 1.3,
                  }}
                >
                  Contact us
                </Typography>
              </AnimatedComponent>
              <AnimatedComponent animationType="slideRight">
                <Typography variant={isSmallScreen ? 'caption' : 'body1'}>
                  Have a question or need assistance? Our team is here to support you 24/7!
                </Typography>
              </AnimatedComponent>
            </Box>
          </Grid2>
        </Grid2>
      </Box>
      <ContactForm isPage />
    </>
  );
}
