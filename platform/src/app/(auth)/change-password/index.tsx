'use client';

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { TextField, Button, Typography, Box, Skeleton, Grid2, InputAdornment, IconButton } from '@mui/material';
import { LockOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { useSelector } from 'react-redux';
import { selectChangePassword, selectCurrentUser } from '@/redux/selectors';
import { changePasswordStart, fetchUserInfo } from '@/redux/slices';
import { useSearchParams } from 'next/navigation';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey, initialFormDataChangePassword } from '@/utils/constants';
import MuiLink from '@mui/material/Link';
import Link from 'next/link';

interface FormData {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface Errors {
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordPage: React.FC = () => {
  const dispatch = useDispatch();
  const { loading: changingPassword } = useSelector(selectChangePassword);

  const { data: currentUser, loading: currentUserLoading } = useSelector(selectCurrentUser);

  const searchParams = useSearchParams();

  const tokenParam = searchParams.get('token');

  const token: any = tokenParam
    ? decodeURIComponent(tokenParam)
    : safeLocalStorageGet(accessTokenKey);

  // Initializing form data with default values
  const [formData, setFormData] = useState<FormData>(initialFormDataChangePassword);

  // Initializing error messages for the form fields
  const [errors, setErrors] = useState<Errors>(initialFormDataChangePassword);

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (token) {
      if (!currentUser) {
        // Fetch user info if token is present and user info is not already loaded
        dispatch(fetchUserInfo({ token }));
      }
    }
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      setFormData((prev) => ({
        ...prev,
        email: currentUser?.email || currentUser?.email,
      }));
    }
  }, [currentUser]);

  // Handler for input change to update form data and reset errors
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setErrors({ ...errors, [event.target.name]: '' });
  };

  // Validating the form fields before submission
  const validate = (): boolean => {
    const tempErrors: Partial<Errors> = initialFormDataChangePassword;
    let isValid = true;

    // Validate current password
    if (!formData.currentPassword) {
      tempErrors.currentPassword = 'Current password is required';
      isValid = false;
    }

    // Validate new password
    if (!formData.newPassword) {
      tempErrors.newPassword = 'New password is required';
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      tempErrors.newPassword = 'Password must be at least 6 characters';
      isValid = false;
    } else if (formData.currentPassword && formData.currentPassword === formData.newPassword) {
      tempErrors.newPassword = 'New password must be different from current password';
      isValid = false;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      tempErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (formData.confirmPassword !== formData.newPassword) {
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
      dispatch(
        // Assuming you have an action to change the password
        changePasswordStart({
          oldPassword: formData.currentPassword, // Send current password as oldPassword
          newPassword: formData.newPassword,
          setFormData,
          token,
        })
      );
    }
  };

  return (
    <Box
      sx={{
        px: { xs: 1, sm: 2 },
        py: 2,
      }}
    >
      <Box mb={3}>
        <Typography variant="h3" color="primary.main">
          Change Password
        </Typography>
        <Typography variant="subtitle2">{'Enter your current and new password'}</Typography>
      </Box>

      {currentUserLoading && (
        <>
          <Skeleton variant="rectangular" width="100%" height={20} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="80%" height={20} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="60%" height={20} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" width="90%" height={20} sx={{ mb: 2 }} />
        </>
      )}
      {currentUser ? (
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 1 }}>
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
            disabled
          />

          <TextField
            required
            fullWidth
            name="currentPassword"
            label="Current Password"
            type={showCurrentPassword ? 'text' : 'password'}
            id="currentPassword"
            autoComplete="current-password"
            onChange={handleChange}
            error={Boolean(errors.currentPassword)}
            helperText={errors.currentPassword}
            value={formData.currentPassword}
            disabled={changingPassword}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle current password visibility"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    edge="end"
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            required
            fullWidth
            name="newPassword"
            label="New Password"
            type={showNewPassword ? 'text' : 'password'}
            id="newPassword"
            autoComplete="new-password"
            onChange={handleChange}
            error={Boolean(errors.newPassword)}
            helperText={errors.newPassword}
            value={formData.newPassword}
            disabled={changingPassword}
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle new password visibility"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    edge="end"
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            required
            fullWidth
            name="confirmPassword"
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            autoComplete="new-password"
            onChange={handleChange}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword}
            value={formData.confirmPassword}
            sx={{ mb: 2 }}
            disabled={changingPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle confirm password visibility"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{
              mt: 3,
              mb: 2,
            }}
            startIcon={<LockOutlined />}
            disabled={changingPassword}
          >
            Change Password
          </Button>
        </Box>
      ) : (
        // Send a password link
        !currentUserLoading && (
          <>
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
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
              }}
              startIcon={<LockOutlined />}
              disabled={changingPassword}
              onClick={() => {
                if (!formData.email) {
                  setErrors({
                    ...errors,
                    email: 'Email is required to send reset link',
                  });
                } else {
                  // Dispatch an action to send password reset link
                  dispatch(
                    changePasswordStart({
                      newPassword: '',
                      setFormData,
                      token,
                      email: formData.email,
                    })
                  );
                }
              }}
            >
              Send Password Reset Link
            </Button>
            <Grid2 container justifyContent="center">
              <Typography variant="body2">
                Login instead?
                <MuiLink component={Link} href="/login" sx={{ ml: 1 }}>
                  Signin
                </MuiLink>
              </Typography>
            </Grid2>
          </>
        )
      )}
    </Box>
  );
};

export default ChangePasswordPage;
