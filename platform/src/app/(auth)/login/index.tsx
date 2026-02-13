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
} from '@mui/material';
import Link from 'next/link';
import { LoginOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
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
      sx={{
        px: { xs: 1, sm: 2 },
        py: 2,
      }}
    >
      <Box mb={4}>
        <Typography variant="h3" color="primary.main">
          Sign In
        </Typography>
        <Typography variant="subtitle2">Welcome! Please sign in to your account.</Typography>
      </Box>

      {/* Already created account for testing */}
      <Box
        mb={4}
        sx={{
          px: 2,
          py: 1,
          border: '1px solid',
          borderColor: 'grey.300',
          borderRadius: 2,
          backgroundColor: '#fff9c4', // light yellow background
          display: 'flex',
        }}
      >
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            Admin:
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ mr: 2 }}>
            Email: <span style={{ fontWeight: 'bold' }}>nxtadm@mailinator.com</span>
          </Typography>
          <br />
          <Typography variant="caption" color="textSecondary">
            Password: <span style={{ fontWeight: 'bold' }}>password123</span>
          </Typography>
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            User:
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ mr: 2 }}>
            Email: <span style={{ fontWeight: 'bold' }}>nxtuser@mailinator.com</span>
          </Typography>
          <br />
          <Typography variant="caption" color="textSecondary">
            Password: <span style={{ fontWeight: 'bold' }}>password123</span>
          </Typography>
        </Box>
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
        />
        <TextField
          required
          fullWidth
          name="password"
          label="Password"
          type="password"
          id="password"
          autoComplete="current-password"
          onChange={handleChange}
          error={Boolean(errors.password)}
          helperText={errors.password}
          value={formData.password}
          sx={{ mb: 4 }}
          disabled={loading}
          slotProps={{
            input: {
              type: showPassword ? 'text' : 'password',
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton color="default" onClick={handleTogglePassword} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          startIcon={loading ? <CircularProgress size={15} color="inherit" /> : <LoginOutlined />}
          sx={{
            mb: 4,
          }}
          disabled={loading}
        >
          Sign In
        </Button>

        <Grid2 container justifyContent="center">
          <Typography variant="body2">
            Forgot Password?
            <MuiLink component={Link} href="/change-password" sx={{ ml: 1 }}>
              Reset
            </MuiLink>
          </Typography>
        </Grid2>
      </Box>
    </Box>
  );
};

export default SignInPage;
