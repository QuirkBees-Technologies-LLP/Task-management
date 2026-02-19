'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import AddonSection from './AddonSection';

interface SubscriptionData {
  id: string;
  status: string;
  planName: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
  trialEnd: number | null;
}

const SubscriptionSettings: React.FC = () => {
  const { data: currentUser } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = currentUser?.role === 'Admin' || isSuperUser;

  const [loading, setLoading] = useState<boolean>(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [organization, setOrganization] = useState<any>(null); // Store full org object for addons
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchSubscription();
      fetchOrganization();
    }
  }, [isAdmin]);

  const fetchOrganization = async () => {
    try {
        const token = safeLocalStorageGet(accessTokenKey);
        if (!token) return;
        
        if (currentUser?.org_id) {
            const response = await axios.get(`/api/organizations/${currentUser.org_id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.data && response.data.organization) {
                setOrganization(response.data.organization);
            }
        }
    } catch (error) {
        console.error("Error fetching organization:", error);
    }
  };

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/stripe/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.status !== 'inactive') {
        setSubscription(response.data);
      } else {
        setSubscription(null);
      }
    } catch (error: any) {
      console.error('Error fetching subscription:', error);
      // Don't show error if 404/inactive just settle with null
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setProcessing(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      await axios.delete('/api/stripe/subscription', {
        headers: { Authorization: `Bearer ${token}` },
      });
      enqueueSnackbar({ message: 'Subscription canceled successfully', variant: 'success' });
      fetchSubscription();
      setOpenCancelDialog(false);
    } catch (error: any) {
      enqueueSnackbar({ message: 'Failed to cancel subscription', variant: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleResumeSubscription = async () => {
    setProcessing(true);
    try {
        const token = safeLocalStorageGet(accessTokenKey);
        await axios.put('/api/stripe/subscription', {}, {
            headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar({ message: 'Subscription resumed successfully', variant: 'success' });
        fetchSubscription();
    } catch (error: any) {
        enqueueSnackbar({ message: 'Failed to resume subscription', variant: 'error' });
    } finally {
        setProcessing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100);
  };

  if (!isAdmin) return null;

  if (loading) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>Subscription</Typography>
        <Stack spacing={2}>
            <CircularProgress size={24} />
            <Typography variant="body2">Loading subscription details...</Typography>
        </Stack>
      </Paper>
    );
  }

  if (!subscription) {
      return (
        <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Subscription</Typography>
            <Alert severity="info">No active subscription found.</Alert>
        </Paper>
      );
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Stack spacing={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
                <Typography variant="h6" gutterBottom>
                    Subscription
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Manage your plan and billing details
                </Typography>
            </Box>
            <Chip 
                label={subscription.status.toUpperCase()} 
                color={subscription.status === 'active' || subscription.status === 'trialing' ? 'success' : 'default'} 
                size="small" 
            />
        </Box>

        <Box p={2} borderRadius={1} border="1px solid" borderColor="divider">
            <Stack spacing={2}>
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Current Plan</Typography>
                    <Typography variant="body1" fontWeight="bold">
                        {subscription.planName} ({subscription.interval})
                    </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">Amount</Typography>
                    <Typography variant="body1" fontWeight="bold">
                        {formatCurrency(subscription.amount, subscription.currency)} / {subscription.interval}
                    </Typography>
                </Box>
                
                {subscription.trialEnd && subscription.status === 'trialing' && (
                    <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">Trial Ends</Typography>
                        <Typography variant="body1" color="primary.main">
                            {formatDate(subscription.trialEnd)}
                        </Typography>
                    </Box>
                )}

                <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                        {subscription.cancelAtPeriodEnd ? 'Expires on' : 'Renews on'}
                    </Typography>
                    <Typography variant="body1">
                        {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'N/A'}
                    </Typography>
                </Box>
            </Stack>
        </Box>

        <Box display="flex" justifyContent="flex-end" gap={2}>
            {subscription.cancelAtPeriodEnd ? (
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleResumeSubscription}
                    disabled={processing}
                    startIcon={processing && <CircularProgress size={16} color="inherit" />}
                >
                    Resume Subscription
                </Button>
            ) : (
                <Button 
                    variant="outlined" 
                    color="error"
                    onClick={() => setOpenCancelDialog(true)}
                    disabled={processing}
                >
                    Cancel Subscription
                </Button>
            )}
        </Box>

        {organization && <AddonSection organization={organization} />}

      </Stack>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={openCancelDialog}
        onClose={() => setOpenCancelDialog(false)}
      >
        <DialogTitle>Cancel Subscription?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel your subscription? Your access will remain active until the end of the current billing period ({formatDate(subscription.currentPeriodEnd)}).
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Keep Subscription</Button>
          <Button onClick={handleCancelSubscription} color="error" autoFocus disabled={processing}>
            {processing ? 'Canceling...' : 'Confirm Cancellation'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default SubscriptionSettings;
