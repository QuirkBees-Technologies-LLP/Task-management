
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  CircularProgress,
  InputAdornment,
  FormHelperText,
  Alert
} from '@mui/material';
import { Add, Edit, Delete, Check, Close } from '@mui/icons-material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';

// Define Plan Interface
interface Plan {
  _id: string;
  plan_name: string;
  type: 'normal' | 'add-on';
  description: string;
  price: {
    monthly: number | null;
    yearly: number | null;
  };
  billing_period: string[];
  users_allowed: number | null;
  organizations_allowed: number | null;
  status: string;
  mark_as_popular: boolean;
  best_for?: string;
  features?: string[];
  trial_type?: string[];
}

const initialPlanState = {
  plan_name: '',
  type: 'normal',
  description: '',
  price: { monthly: '', yearly: '' },
  billing_period: ['monthly', 'yearly'],
  users_allowed: '',
  organizations_allowed: '',
  status: 'active',
  mark_as_popular: false,
  best_for: '',
  features: '',
  trial_type: '',
};

export default function PlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>(initialPlanState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      const response = await axios.get('/api/superadmin/plans?limit=100', { // Fetch all for management
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      enqueueSnackbar('Failed to fetch plans', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan?: Plan) => {
    if (plan) {
      setIsEdit(true);
      setCurrentPlanId(plan._id);
      setFormData({
        plan_name: plan.plan_name,
        type: plan.type || 'normal',
        description: plan.description,
        price: {
          monthly: plan.price.monthly || '',
          yearly: plan.price.yearly || '',
        },
        billing_period: plan.billing_period || [],
        users_allowed: plan.users_allowed !== null ? plan.users_allowed : '',
        organizations_allowed: plan.organizations_allowed !== null ? plan.organizations_allowed : '',
        status: plan.status,
        mark_as_popular: plan.mark_as_popular,
        best_for: plan.best_for || '',
        features: plan.features ? plan.features.join('\n') : '',
        trial_type: plan.trial_type ? plan.trial_type.join(',') : '',
      });
    } else {
      setIsEdit(false);
      setCurrentPlanId(null);
      setFormData(initialPlanState);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSubmitting(false);
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData((prev: any) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const handleBillingPeriodChange = (period: string) => {
    setFormData((prev: any) => {
       const current = prev.billing_period as string[];
       if (current.includes(period)) {
           return { ...prev, billing_period: current.filter(p => p !== period) };
       } else {
           return { ...prev, billing_period: [...current, period] };
       }
    });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      
      // Prepare payload
      const payload = {
          ...formData,
          users_allowed: formData.users_allowed === '' ? (formData.type === 'add-on' ? 0 : -1) : Number(formData.users_allowed),
          organizations_allowed: formData.organizations_allowed === '' ? -1 : Number(formData.organizations_allowed),
          price: {
              monthly: formData.price.monthly === '' ? null : Number(formData.price.monthly),
              yearly: formData.price.yearly === '' ? null : Number(formData.price.yearly),
          },
          features: formData.features.split('\n').filter((f: string) => f.trim() !== ''),
          trial_type: formData.type === 'add-on' ? [] : formData.trial_type.split(',').filter((t: string) => t.trim() !== ''),
      };

      if (isEdit && currentPlanId) {
          await axios.patch(`/api/superadmin/plans/${currentPlanId}`, payload, {
              headers: { Authorization: `Bearer ${token}` },
          });
          enqueueSnackbar('Plan updated successfully', { variant: 'success' });
      } else {
          await axios.post('/api/superadmin/plans', payload, {
              headers: { Authorization: `Bearer ${token}` },
          });
          enqueueSnackbar('Plan created successfully', { variant: 'success' });
      }
      
      handleCloseDialog();
      fetchPlans();

    } catch (error: any) {
      console.error('Error saving plan:', error);
      enqueueSnackbar(error.response?.data?.message || 'Failed to save plan', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
      if (!confirm('Are you sure you want to delete this plan?')) return;
      
      try {
          const token = safeLocalStorageGet(accessTokenKey);
          await axios.delete(`/api/superadmin/plans/${id}`, {
              headers: { Authorization: `Bearer ${token}` },
          });
          enqueueSnackbar('Plan deleted successfully', { variant: 'success' });
          fetchPlans();
      } catch (error) {
          console.error('Error deleting plan:', error);
          enqueueSnackbar('Failed to delete plan', { variant: 'error' });
      }
  };

  return (
    <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5">Plans Management</Typography>
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => handleOpenDialog()}
            >
                Create Plan
            </Button>
        </Box>

        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Price</TableCell>
                        <TableCell>Users Allowed</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} align="center"><CircularProgress /></TableCell>
                        </TableRow>
                    ) : plans.map((plan) => (
                        <TableRow key={plan._id}>
                            <TableCell>
                                <Typography variant="subtitle2">{plan.plan_name}</Typography>
                                <Typography variant="caption" color="text.secondary">{plan.description}</Typography>
                            </TableCell>
                            <TableCell>
                                <Chip 
                                    label={plan.type === 'add-on' ? 'Add-on' : 'Normal'} 
                                    color={plan.type === 'add-on' ? 'secondary' : 'primary'} 
                                    size="small" 
                                    variant="outlined"
                                />
                            </TableCell>
                            <TableCell>
                                {plan.price.monthly && <div>${plan.price.monthly}/mo</div>}
                                {plan.price.yearly && <div>${plan.price.yearly}/yr</div>}
                            </TableCell>
                            <TableCell>
                                {plan.users_allowed === -1 ? 'Unlimited' : (
                                    plan.type === 'add-on' ? `+${plan.users_allowed}` : plan.users_allowed
                                )}
                            </TableCell>
                            <TableCell>
                                <Chip 
                                    label={plan.status} 
                                    color={plan.status === 'active' ? 'success' : 'default'} 
                                    size="small" 
                                />
                            </TableCell>
                            <TableCell align="right">
                                <IconButton size="small" onClick={() => handleOpenDialog(plan)}><Edit fontSize="small" /></IconButton>
                                <IconButton size="small" color="error" onClick={() => handleDelete(plan._id)}><Delete fontSize="small" /></IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
            <DialogTitle>{isEdit ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Plan Name"
                            value={formData.plan_name}
                            onChange={(e) => handleInputChange('plan_name', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel>Type</InputLabel>
                            <Select
                                value={formData.type}
                                label="Type"
                                onChange={(e) => handleInputChange('type', e.target.value)}
                            >
                                <MenuItem value="normal">Normal</MenuItem>
                                <MenuItem value="add-on">Add-on</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Description"
                            multiline
                            rows={2}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                         <TextField
                            fullWidth
                            label="Monthly Price"
                            type="number"
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            value={formData.price.monthly}
                            onChange={(e) => handleInputChange('price.monthly', e.target.value)}
                        />
                        <FormControlLabel
                            control={<Switch checked={formData.billing_period.includes('monthly')} onChange={() => handleBillingPeriodChange('monthly')} />}
                            label="Enable Monthly Billing"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                         <TextField
                            fullWidth
                            label="Yearly Price"
                            type="number"
                            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                            value={formData.price.yearly}
                            onChange={(e) => handleInputChange('price.yearly', e.target.value)}
                        />
                        <FormControlLabel
                            control={<Switch checked={formData.billing_period.includes('yearly')} onChange={() => handleBillingPeriodChange('yearly')} />}
                            label="Enable Yearly Billing"
                        />
                    </Grid>

                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label={formData.type === 'add-on' ? "Users Limit Increment" : "Users Allowed"}
                            type="number"
                            helperText={formData.type === 'add-on' ? "Adds this many users to account" : "-1 for Unlimited"}
                            value={formData.users_allowed}
                            onChange={(e) => handleInputChange('users_allowed', e.target.value)}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                         <TextField
                            fullWidth
                            label={formData.type === 'add-on' ? "Orgs Limit Increment" : "Organizations Allowed"}
                            type="number"
                            helperText="-1 for Unlimited"
                            value={formData.organizations_allowed}
                            onChange={(e) => handleInputChange('organizations_allowed', e.target.value)}
                        />
                    </Grid>

                    {formData.type === 'normal' && (
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Trial Period (e.g. 14-days)"
                                value={formData.trial_type}
                                onChange={(e) => handleInputChange('trial_type', e.target.value)}
                            />
                        </Grid>
                    )}

                    <Grid item xs={12} md={6}>
                         <FormControl fullWidth>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={formData.status}
                                label="Status"
                                onChange={(e) => handleInputChange('status', e.target.value)}
                            >
                                <MenuItem value="active">Active</MenuItem>
                                <MenuItem value="inactive">Inactive</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Features (One per line)"
                            multiline
                            rows={4}
                            value={formData.features}
                            onChange={(e) => handleInputChange('features', e.target.value)}
                        />
                    </Grid>
                    
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={formData.mark_as_popular} 
                                    onChange={(e) => handleInputChange('mark_as_popular', e.target.checked)} 
                                />
                            }
                            label="Mark as Popular"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
  );
}
