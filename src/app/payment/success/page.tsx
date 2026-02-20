'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Container, Card, CardContent, CircularProgress, Divider, Grid } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '@/redux/slices';
import { accessTokenKey } from '@/utils/constants';

interface SessionDetails {
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  trialEnd: number | null;
  nextBillingDate: number | null;
  customer_email: string;
  isNewSignup?: boolean;
}

export default function PaymentSuccessPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<SessionDetails | null>(null);
  const [attemptingLogin, setAttemptingLogin] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
        if (!sessionId) return;
        try {
            const { data } = await axios.get(`/api/stripe/session?session_id=${sessionId}`);
            setDetails(data);
            
            // If this is a new signup, attempt to auto-login after a short delay
            // (giving webhook time to create account)
            if (data.isNewSignup && data.customer_email) {
              // Wait a bit for webhook to process
              setTimeout(() => {
                attemptAutoLogin(data.customer_email);
              }, 3000); // 3 second delay for webhook processing
            }
        } catch (error) {
            console.error("Failed to fetch session details:", error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchSession();
  }, [sessionId]);

  const attemptAutoLogin = async (email: string) => {
    if (attemptingLogin || !sessionId) return;
    
    setAttemptingLogin(true);
    try {
      // Wait a bit more to ensure webhook has processed
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Attempt auto-login using session verification
      const response = await axios.post('/api/auth/login-after-payment', {
        sessionId,
        email,
      });

      if (response.data.success && response.data.token) {
        // Store token and login
        localStorage.setItem(accessTokenKey, response.data.token);
        dispatch(loginSuccess({
          user: response.data.user,
          token: response.data.token,
        }));
        
        // Redirect to dashboard
        router.push('/dashboard/projects');
      }
    } catch (error: any) {
      console.error('Auto-login failed:', error);
      // If auto-login fails, user can manually login
      // The page will show login button
      setAttemptingLogin(false);
    }
  };

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
        <CardContent sx={{p: '0 !important' }}>
          <Box display="flex" justifyContent="center" mb={2}>
            <CheckCircleOutlineIcon color="success" sx={{ fontSize: 60 }} />
          </Box>
          <Typography variant="h4" component="h1" gutterBottom color="success.main" sx={{mb: '0 !important'}}>
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
                             <Box bgcolor="success.light" p={2} borderRadius={1} mt={1}>
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
                Thank you for subscribing. {details?.isNewSignup ? 'Your account has been created. Please log in to access your dashboard.' : 'Proceed to your dashboard.'}
            </Typography>
          )}

          {details?.isNewSignup ? (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your account has been created successfully. {attemptingLogin ? 'Logging you in...' : 'Please log in to continue.'}
              </Typography>
              {attemptingLogin ? (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress size={24} />
                </Box>
              ) : (
                <Button 
                  variant="contained" 
                  size="large" 
                  component={Link} 
                  href={`/login?email=${encodeURIComponent(details.customer_email || '')}`}
                  fullWidth
                  sx={{ background: 'linear-gradient(90deg, #005B8E 0%, #03D7FE 100%)' }}
                >
                  Go to Login
                </Button>
              )}
            </Box>
          ) : (
            <Button 
              variant="contained" 
              size="large" 
              component={Link} 
              href="/dashboard"
              fullWidth
              sx={{ background: 'linear-gradient(90deg, #005B8E 0%, #03D7FE 100%)' }}
            >
              Go to Dashboard
            </Button>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
