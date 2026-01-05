'use client';

import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Stack,
  CircularProgress,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import PageHeader from '@/components/PageHeader';
import { useEffect } from 'react';

const ChangePasswordPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = safeLocalStorageGet(accessTokenKey);
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const validate = (): boolean => {
    const newErrors = {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    let isValid = true;

    if (!formData.oldPassword) {
      newErrors.oldPassword = 'Old password is required';
      isValid = false;
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (formData.oldPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from old password';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      await axios.post(
        '/api/auth/change-password',
        {
          oldPassword: formData.oldPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      enqueueSnackbar({
        message: 'Password changed successfully',
        variant: 'success',
      });

      // Reset form
      setFormData({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      enqueueSnackbar({
        message: errorMessage,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Change Password" />

      <Box sx={{ mt: 3, maxWidth: 600, mx: 'auto' }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Update Your Password
          </Typography>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Old Password"
                name="oldPassword"
                type="password"
                value={formData.oldPassword}
                onChange={handleInputChange}
                error={!!errors.oldPassword}
                helperText={errors.oldPassword}
                disabled={loading}
                required
              />

              <TextField
                fullWidth
                label="New Password"
                name="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={handleInputChange}
                error={!!errors.newPassword}
                helperText={errors.newPassword}
                disabled={loading}
                required
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                disabled={loading}
                required
              />

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/profile')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={15} color="inherit" />}
                >
                  Change Password
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default ChangePasswordPage;
