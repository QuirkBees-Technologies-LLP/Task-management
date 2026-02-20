'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid2,
  Link as MuiLink,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { signupStart } from '@/redux/slices';
import { useSelector } from 'react-redux';
import { selectAuthLoading } from '@/redux/selectors';
import axios from 'axios';

interface Plan {
  _id: string;
  plan_name: string;
  description: string;
  price: {
    monthly: number | null;
    yearly: number | null;
  };
  features: string[];
  mark_as_popular?: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  planId: string;
  billingPeriod: 'monthly' | 'yearly';
}

interface Errors {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  organizationName: string;
  planId: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
  planId: '',
  billingPeriod: 'monthly',
};

const initialErrors: Errors = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  organizationName: '',
  planId: '',
};

const SignupPage: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const loading = useSelector(selectAuthLoading);

  // Initializing form data with default values
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Initializing error messages for the form fields
  const [errors, setErrors] = useState<Errors>(initialErrors);

  // Plans state
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  // Fetch plans on component mount
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const response = await axios.get('/api/plans');
        if (response.data.success && response.data.plans) {
          setPlans(response.data.plans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  // Handler for input change to update form data and reset errors
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: '' });
  };

  // Handler for plan selection
  const handlePlanChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, planId: event.target.value });
    setErrors({ ...errors, planId: '' });
  };

  // Validating the form fields before submission
  const validate = (): boolean => {
    const tempErrors: Partial<Errors> = { ...initialErrors };
    let isValid = true;

    // Full Name validation
    if (!formData.firstName) {
      tempErrors.firstName = 'First Name is required';
      isValid = false;
    }

    if (!formData.lastName) {
      tempErrors.lastName = 'Last Name is required';
      isValid = false;
    }

    // Email validation
    if (!formData.email) {
      tempErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Email is not valid';
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      tempErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      tempErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = 'Confirm Password is required';
      isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Organization Name validation
    if (!formData.organizationName) {
      tempErrors.organizationName = 'Organization Name is required';
      isValid = false;
    } else if (formData.organizationName.length < 2 || formData.organizationName.length > 100) {
      tempErrors.organizationName = 'Organization name must be between 2 and 100 characters';
      isValid = false;
    }

    // Plan selection validation
    if (!formData.planId) {
      tempErrors.planId = 'Please select a plan';
      isValid = false;
    }

    setErrors((prevErrors) => ({ ...prevErrors, ...tempErrors }));
    return isValid;
  };

  // Handler for form submission to validate and process data
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validate()) {
      dispatch(signupStart({ formData, router }));
    }
  };

  return (
    <Box
      sx={{
        px: { xs: 1, sm: 2 },
        py: 2,
      }}
    >
      <Box mb={4}>
        <Typography variant="h3" color="primary.main">
          Create Account
        </Typography>
        <Typography variant="subtitle2">
          Join us to start managing your projects effectively
        </Typography>
      </Box>

      <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
        <Grid2 container spacing={2}>
          <Grid2 size={6}>
            <TextField
              required
              fullWidth
              id="firstName"
              label="First Name"
              name="firstName"
              autoComplete="name"
              sx={{ mb: 2 }}
              onChange={handleChange}
              error={Boolean(errors.firstName)}
              helperText={errors.firstName}
              disabled={loading}
            />
          </Grid2>
          <Grid2 size={6}>
            <TextField
              required
              fullWidth
              id="lastName"
              label="Last Name"
              name="lastName"
              autoComplete="name"
              sx={{ mb: 2 }}
              onChange={handleChange}
              error={Boolean(errors.lastName)}
              helperText={errors.lastName}
              disabled={loading}
            />
          </Grid2>
        </Grid2>
        <TextField
          required
          fullWidth
          id="email"
          label="Email Address"
          name="email"
          autoComplete="email"
          sx={{ mb: 2 }}
          onChange={handleChange}
          error={Boolean(errors.email)}
          helperText={errors.email}
          disabled={loading}
        />
        <TextField
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="new-password"
          sx={{ mb: 2 }}
          onChange={handleChange}
          error={Boolean(errors.password)}
          helperText={errors.password}
          disabled={loading}
        />
        <TextField
          required
          fullWidth
          name="confirmPassword"
          label="Confirm Password"
          type="password"
          id="confirmPassword"
          autoComplete="new-password"
          sx={{ mb: 2 }}
          onChange={handleChange}
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword}
          disabled={loading}
        />

        <TextField
          required
          fullWidth
          id="organizationName"
          label="Organization Name"
          name="organizationName"
          sx={{ mb: 2 }}
          onChange={handleChange}
          error={Boolean(errors.organizationName)}
          helperText={errors.organizationName}
          disabled={loading}
          placeholder="Enter your company or organization name"
        />

        {/* Plan Selection */}
        <Box sx={{ mb: 3 }}>
          <FormControl component="fieldset" error={Boolean(errors.planId)} fullWidth>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 0 }}>
                Select a Plan <span style={{ color: 'red' }}>*</span>
              </FormLabel>
              
              {/* Billing Period Toggle */}
              <Box 
                sx={{ 
                  display: 'flex', 
                  bgcolor: 'background.paper', 
                  borderRadius: 1, 
                  border: 1, 
                  borderColor: 'divider',
                  p: 0.5 
                }}
              >
                <Button
                  size="small"
                  variant={formData.billingPeriod === 'monthly' ? 'contained' : 'text'}
                  onClick={() => setFormData({ ...formData, billingPeriod: 'monthly' })}
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 1,
                    minWidth: 80,
                    boxShadow: 'none'
                  }}
                >
                  Monthly
                </Button>
                <Button
                  size="small"
                  variant={formData.billingPeriod === 'yearly' ? 'contained' : 'text'}
                  onClick={() => setFormData({ ...formData, billingPeriod: 'yearly' })}
                  sx={{ 
                    textTransform: 'none', 
                    borderRadius: 1,
                    minWidth: 80,
                    boxShadow: 'none'
                  }}
                >
                  Yearly
                </Button>
              </Box>
            </Box>
            {loadingPlans ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress size={24} />
              </Box>
            ) : plans.length === 0 ? (
              <Typography color="error" variant="body2">
                No plans available. Please contact support.
              </Typography>
            ) : (
              <RadioGroup
                name="planId"
                value={formData.planId}
                onChange={handlePlanChange}
                sx={{ gap: 2 }}
              >
                {plans.map((plan) => (
                  <Card
                    key={plan._id}
                    sx={{
                      border: formData.planId === plan._id ? '2px solid' : '1px solid',
                      borderColor:
                        formData.planId === plan._id ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: 2,
                      },
                    }}
                    onClick={() => {
                      setFormData({ ...formData, planId: plan._id });
                      setErrors({ ...errors, planId: '' });
                    }}
                  >
                    <CardContent>
                      <FormControlLabel
                        value={plan._id}
                        control={<Radio />}
                        label={
                          <Box>
                            <Box display="flex" alignItems="center" gap={1} mb={1}>
                              <Typography variant="h6" component="span">
                                {plan.plan_name}
                              </Typography>
                              {plan.mark_as_popular && (
                                <Chip
                                  label="Popular"
                                  color="primary"
                                  size="small"
                                  sx={{ height: 20 }}
                                />
                              )}
                            </Box>
                            {plan.description && (
                              <Typography variant="body2" color="text.secondary" mb={1}>
                                {plan.description}
                              </Typography>
                            )}
                            <Box display="flex" gap={2} alignItems="center">
                              {formData.billingPeriod === 'monthly' && plan.price.monthly !== null && (
                                <Typography variant="body1" fontWeight="bold">
                                  ${plan.price.monthly}/month
                                </Typography>
                              )}
                              {formData.billingPeriod === 'yearly' && plan.price.yearly !== null && (
                                <Typography variant="body1" fontWeight="bold">
                                  ${plan.price.yearly}/year
                                </Typography>
                              )}
                              {/* Show the other price as secondary info if desired, or hide it */}
                              {formData.billingPeriod === 'monthly' && plan.price.yearly !== null && (
                                <Typography variant="caption" color="text.secondary">
                                  (or ${plan.price.yearly}/year)
                                </Typography>
                              )}
                               {formData.billingPeriod === 'yearly' && plan.price.monthly !== null && (
                                <Typography variant="caption" color="text.secondary">
                                  (or ${plan.price.monthly}/month)
                                </Typography>
                              )}
                            </Box>
                            <Chip
                              label="15 days free trial"
                              color="success"
                              size="small"
                              sx={{ mt: 1 }}
                            />
                          </Box>
                        }
                        sx={{ width: '100%', m: 0 }}
                      />
                    </CardContent>
                  </Card>
                ))}
              </RadioGroup>
            )}
            {errors.planId && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                {errors.planId}
              </Typography>
            )}
          </FormControl>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            mb: 4,
          }}
          startIcon={loading && <CircularProgress size={15} color="inherit" />}
          disabled={loading || loadingPlans}
        >
          Sign Up
        </Button>

        <Grid2 container justifyContent="center">
          <Typography variant="body2">
            Already have an account?{' '}
            <MuiLink component={Link} href="/login" sx={{ ml: 1 }}>
              Sign in
            </MuiLink>
          </Typography>
        </Grid2>
      </Box>
    </Box>
  );
};

export default SignupPage;
