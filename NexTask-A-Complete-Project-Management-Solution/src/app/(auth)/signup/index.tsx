'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid2,
  Link as MuiLink,
  CircularProgress,
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { signupStart } from '@/redux/slices';
import { useSelector } from 'react-redux';
import { selectAuthLoading } from '@/redux/selectors';
import { userRoles } from '@/utils/constants';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
}

interface Errors {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: userRoles.admin,
};

const SignupPage: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const loading = useSelector(selectAuthLoading);

  // Initializing form data with default values
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Initializing error messages for the form fields
  const [errors, setErrors] = useState<Errors>(initialFormData);

  // Handler for input change to update form data and reset errors
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: '' });
  };

  // Validating the form fields before submission
  const validate = (): boolean => {
    const tempErrors: Partial<Errors> = initialFormData;
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

        <Button
          type="submit"
          fullWidth
          variant="contained"
          sx={{
            mt: 2,
            mb: 4,
          }}
          startIcon={loading && <CircularProgress size={15} color="inherit" />}
          disabled={loading}
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
