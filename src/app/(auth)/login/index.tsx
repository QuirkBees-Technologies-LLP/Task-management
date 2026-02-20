'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid2,
  Divider,
  Link as MuiLink,
  CircularProgress,
  InputAdornment,
  IconButton,
  Paper,
} from '@mui/material';
import Link from 'next/link';
import { EmailOutlined, LockOutlined, LoginOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { loginStart } from '@/redux/slices';
import { selectAuthLoading } from '@/redux/selectors';
import { useSelector } from 'react-redux';

// Type definitions for form data and errors
interface FormData {
  email: string;
  password: string;
}

interface Errors {
  email: string;
  password: string;
}

const SignInPage: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();

  const loading = useSelector(selectAuthLoading);

  // Initializing form data with default values
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
  });

  // Initializing error messages for the form fields
  const [errors, setErrors] = useState<Errors>({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  // Handler for input change to update form data and reset errors
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: '' });
  };

  // Validating the form fields before submission
  const validate = (): boolean => {
    const tempErrors: Partial<Errors> = { email: '', password: '' };
    let isValid = true;

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

    setErrors((prevErrors) => ({ ...prevErrors, ...tempErrors }));
    return isValid;
  };

  // Handler for form submission to validate and process data
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (validate()) {
      dispatch(loginStart({ formData, router }));
    }
  };

  return (
    <Box
    >
      {/* Login Card */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          p: { xs: 3, sm: 5 },
          borderRadius: "14px",
          backgroundColor: "#fff",
          border: "1px solid #e6eaf0",
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        {/* Heading */}
        <Box mb={4} textAlign="center">
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              background: "linear-gradient(90deg, #005B8E 0%, #03D7FE 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Sign In
          </Typography>

          <Typography variant="body2" color="text.secondary" mt={1}>
            Welcome! Please sign in to your account.
          </Typography>
        </Box>

        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            required
            fullWidth
            id="email"
            label="Email Address"
            name="email"
            autoComplete="email"
            onChange={handleChange}
            error={Boolean(errors.email)}
            helperText={errors.email}
            value={formData.email}
            sx={{ mb: 2 }}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined color="action" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            required
            fullWidth
            name="password"
            label="Password"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            onChange={handleChange}
            error={Boolean(errors.password)}
            helperText={errors.password}
            value={formData.password}
            sx={{ mb: 1 }}
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          {/* Forgot Password */}
          <Box textAlign="right" mb={3}>
            <MuiLink
              component={Link}
              href="/change-password"
              underline="hover"
              sx={{
                fontSize: 13,
                color: "#005B8E",
                fontWeight: 500,
              }}
            >
              Forgot Password?
            </MuiLink>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={16} color="inherit" /> : <LoginOutlined />
            }
            sx={{
              height: 48,
              borderRadius: "10px",
              fontSize: 15,
              fontWeight: 600,
              textTransform: "none",
              background: "linear-gradient(90deg, #005B8E 0%, #03D7FE 100%)",
              boxShadow: "0 6px 18px rgba(3,215,254,0.25)",
              "&:hover": {
                background: "linear-gradient(90deg,#00476f,#02c6e7)",
              },
            }}
          >
            Sign In
          </Button>

          <Divider sx={{ my: 3 }} />

          <Typography textAlign="center" variant="body2" color="text.secondary">
            Need help? Contact support@opsdeck.app
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default SignInPage;


{/* Password */ }
{/* <TextField
  fullWidth
  label="Password"
  type={showPassword ? "text" : "password"}
  sx={{ mb: 1 }}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <LockOutlined color="action" />
      </InputAdornment>
    ),
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    ),
  }}
/> */}

