'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Avatar,
  Grid,
  Stack,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '@/redux/selectors';
import { fetchUserInfo, addUser } from '@/redux/slices';
import PageHeader from '@/components/PageHeader';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: userInfo, loading } = useSelector(selectCurrentUser);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
  });
  const [photoUrl, setPhotoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const token = safeLocalStorageGet(accessTokenKey);
    if (!token) {
      router.push('/login');
      return;
    }
    dispatch(fetchUserInfo());
  }, [dispatch, router]);

  useEffect(() => {
    if (userInfo) {
      setFormData({
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        email: userInfo.email || '',
        role: userInfo.role || '',
      });
      setPhotoUrl(userInfo.photoUrl || '');
    }
  }, [userInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // For now, just use a placeholder URL as requested
      const placeholderUrl = `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=random`;
      setPhotoUrl(placeholderUrl);
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      await axios.put(
        '/api/users',
        [{ ...formData, photo: photoUrl }],
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Refresh user info
      dispatch(fetchUserInfo());
      setEditing(false);
      enqueueSnackbar({
        message: 'Profile updated successfully',
        variant: 'success',
      });
    } catch (error: any) {
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to update profile',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (userInfo) {
      setFormData({
        firstName: userInfo.firstName || '',
        lastName: userInfo.lastName || '',
        email: userInfo.email || '',
        role: userInfo.role || '',
      });
      setPhotoUrl(userInfo.photoUrl || '');
    }
    setEditing(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!userInfo) {
    return (
      <Box>
        <Typography>No user information available</Typography>
      </Box>
    );
  }

  const displayName = `${formData.firstName} ${formData.lastName}`.trim() || 'User';

  return (
    <>
      <PageHeader
        title="Profile"
        action={
          editing ? (
            <Stack direction="row" spacing={2}>
              <Button variant="outlined" onClick={handleCancel} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                startIcon={saving && <CircularProgress size={15} color="inherit" />}
              >
                Save Changes
              </Button>
            </Stack>
          ) : (
            <Button variant="contained" onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          )
        }
      />

      <Box sx={{ mt: 3 }}>
        <Grid container spacing={3}>
          {/* Avatar and Basic Info Card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="avatar-upload"
                type="file"
                onChange={handleAvatarChange}
                disabled={!editing || saving}
              />
              <label htmlFor="avatar-upload">
                <Avatar
                  src={photoUrl}
                  alt={displayName}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    cursor: editing ? 'pointer' : 'default',
                  }}
                >
                  {displayName.charAt(0).toUpperCase()}
                </Avatar>
              </label>

              <Typography variant="h5" sx={{ mb: 1 }}>
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {formData.email}
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" fontWeight="medium">
                  {formData.role || 'Regular User'}
                </Typography>
              </Paper>
            </Paper>
          </Grid>

          {/* Profile Details Card */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Profile Information
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={!editing || saving}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={!editing || saving}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={formData.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Role"
                    name="role"
                    value={formData.role}
                    disabled
                    helperText="Role is managed by administrators"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default ProfilePage;
