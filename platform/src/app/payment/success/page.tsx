'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Container, Card, CardContent, CircularProgress, Divider, Grid } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

interface SessionDetails {
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  trialEnd: number | null;
  nextBillingDate: number | null;
  customer_email: string;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<SessionDetails | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
        if (!sessionId) return;
        try {
            const { data } = await axios.get(`/api/stripe/session?session_id=${sessionId}`);
            setDetails(data);
        } catch (error) {
            console.error("Failed to fetch session details:", error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchSession();
  }, [sessionId]);

  const formatDate = (timestamp: number) => {
      return new Date(timestamp * 1000).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
      });
  };

  const formatCurrency = (amount: number, currency: string) => {
      return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
      }).format(amount / 100);
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, textAlign: 'center' }}>
      <Card sx={{ p: 4, boxShadow: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="center" mb={2}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom color="success.main">
            Payment Successful!
          </Typography>
          
          {loading ? (
             <Box display="flex" justifyContent="center" my={4}>
                <CircularProgress />
             </Box>
          ) : details ? (
             <Box textAlign="left" my={3}>
                <Typography variant="h6" gutterBottom align="center">
                    Subscription Confirmed
                </Typography>
                <Divider sx={{ my: 2 }} />
                
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">Plan</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {details.planName} ({details.interval}ly)
                        </Typography>
                    </Grid>
                    <Grid item xs={6} textAlign="right">
                        <Typography variant="body2" color="text.secondary">Amount</Typography>
                        <Typography variant="body1" fontWeight="bold">
                            {formatCurrency(details.amount, details.currency)} / {details.interval}
                        </Typography>
                    </Grid>
                    
                    {details.trialEnd && (
                        <Grid item xs={12}>
                             <Box bgcolor="success.light" p={2} borderRadius={2} mt={1}>
                                <Typography variant="body2" color="success.contrastText">
                                    <strong>Trial Active:</strong> Your free trial ends on {formatDate(details.trialEnd)}.
                                    You will not be charged until then.
                                </Typography>
                             </Box>
                        </Grid>
                    )}
                    
                    <Grid item xs={12} mt={1}>
                        <Typography variant="body2" color="text.secondary" align="center">
                            Next billing date: {details.nextBillingDate ? formatDate(details.nextBillingDate) : formatDate(details.trialEnd) || 'N/A'}
                        </Typography>
                    </Grid>
                </Grid>
             </Box>
          ) : (
            <Typography variant="body1" color="text.secondary" paragraph>
                Thank you for subscribing. proceed to your dashboard.
            </Typography>
          )}

          <Button 
            variant="contained" 
            size="large" 
            component={Link} 
            href="/dashboard"
            fullWidth
            sx={{ mt: 2 }}
          >
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </Container>
  );
}
