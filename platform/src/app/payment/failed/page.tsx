'use client';

import React from 'react';
import { Box, Typography, Button, Container, Card, CardContent } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Link from 'next/link';

export default function PaymentFailedPage() {
  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
      <Card sx={{ p: 4, boxShadow: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="center" mb={2}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom color="error.main">
            Payment Failed
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            We were unable to process your payment. Please try again or use a different payment method.
          </Typography>
          
          <Box display="flex" gap={2} justifyContent="center" mt={4}>
            <Button 
              variant="outlined" 
              component={Link} 
              href="/signup"
            >
              Back to Signup
            </Button>
             <Button 
              variant="contained" 
              component={Link} 
              href="/support"
            >
              Contact Support
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
