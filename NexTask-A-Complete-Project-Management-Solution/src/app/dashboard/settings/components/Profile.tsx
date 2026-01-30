'use client';
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Avatar,
  Grid2,
  Stack,
  Paper,
  Typography,
  Skeleton,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { styled } from '@mui/system';
import Link from 'next/link';
import { selectCurrentUser, selectUsers } from '@/redux/selectors';
import { useSelector } from 'react-redux';
import { countries } from '@/utils/data';
import { useDispatch } from 'react-redux';
import { addUser } from '@/redux/slices';
import PageHeader from '@/components/PageHeader';
import { Delete, KeyOutlined, Warning } from '@mui/icons-material';

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: theme.spacing(12),
  height: theme.spacing(12),
  marginBottom: theme.spacing(2),
}));

const ProfileSettings: React.FC = ({ }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState<any>({});
  const [selectedCountry, setSelectedCountry] = React.useState('');
  const [selectedGender, setSelectedGender] = useState<any>('');

  const [photoUrl, setPhotoUrl] = useState('');

  const handleSaveChanges = (e) => {
    e.preventDefault();
    dispatch(addUser({ formData: { ...formData, photo: photoUrl } }));
  };
  const { data: currentUserInfo, loading } = useSelector(selectCurrentUser);
  const { saving } = useSelector(selectUsers);

  useEffect(() => {
    if (currentUserInfo) {
      setFormData(currentUserInfo);
      setSelectedGender(currentUserInfo.gender ?? '');
      setSelectedCountry(currentUserInfo.country ?? '');
      setPhotoUrl(currentUserInfo.photoUrl ?? '');
    }
  }, [currentUserInfo]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement> | any) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          setPhotoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
    e.target.value = '';
  };

  const handleDeleteAvatar = () => {
    setPhotoUrl('');
  };

  return loading ? (
    <Grid2 container spacing={3}>
      {/* Avatar Section */}
      <Grid2 size={{ xs: 12, sm: 5, md: 4 }}>
        <Paper sx={{ minHeight: 360, p: 2 }}>
          <Stack sx={{ mt: 6 }} justifyContent="center" alignItems="center">
            <Box textAlign="center">
              <Skeleton variant="circular" width={100} height={100} />
              <Skeleton width={200} height={20} sx={{ mt: 2, mb: 1 }} />
              <Skeleton variant="rectangular" width={130} height={36} />
              <Skeleton variant="rectangular" width={150} height={36} sx={{ mt: 2 }} />
            </Box>
          </Stack>
        </Paper>
      </Grid2>

      {/* Form Fields Section */}
      <Grid2 size={{ xs: 12, sm: 7, md: 8 }}>
        <Paper sx={{ minHeight: 360, p: 3 }}>
          <Grid2 container spacing={3}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid2 key={i} size={6}>
                <Skeleton variant="rectangular" height={56} />
              </Grid2>
            ))}
            <Grid2 size={12}>
              <Skeleton variant="rectangular" height={120} />
            </Grid2>
            <Grid2 size={12}>
              <Skeleton variant="rectangular" width={160} height={40} sx={{ float: 'right' }} />
            </Grid2>
          </Grid2>
        </Paper>
      </Grid2>
    </Grid2>
  ) : (
    <form onSubmit={handleSaveChanges}>
      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          padding: "16px 24px",
          borderRadius: "8px",
          mb: 3,
        }}
      >
        <PageHeader
          title="Settings"
          action={
            <>
              <Link href={'/change-password'}>
                <Button sx={{ mr: 2 }} variant="outlined" startIcon={<KeyOutlined />}>
                  Change Password
                </Button>
              </Link>
              <Button
                disabled={saving}
                startIcon={saving && <CircularProgress color="inherit" size={15} />}
                variant="contained"
                sx={{ float: 'right' }}
                type="submit"
              >
                Save Changes
              </Button>
            </>
          }
        />
      </Box>
      <Box my={2}>
        <Grid2 container spacing={3}>
          {/* Avatar Section */}
          <Grid2 size={{ xs: 12, sm: 5, md: 4 }}>
            <Paper sx={{ minHeight: 360, p: 2 }}>
              <Stack sx={{ mt: 6 }} justifyContent={'center'} alignItems={'center'}>
                <Box textAlign="center">
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="avatar-upload"
                    type="file"
                    onChange={handleAvatarChange}
                    disabled={saving}
                  />
                  <label htmlFor="avatar-upload">
                    <Stack justifyContent="center" alignItems="center" spacing={2}>
                      <StyledAvatar src={photoUrl} alt="Profile Avatar" sx={{ ml: 2 }}>
                        {!photoUrl && formData?.firstName?.charAt(0)}
                      </StyledAvatar>

                      <Typography variant="caption" sx={{ width: 200 }}>
                        Allowed *.jpeg, *.jpg, *.png, *.gif max size of 10MB
                      </Typography>

                      <Stack direction="row" spacing={1}>
                        <Button disabled={saving} variant="outlined" component="span">
                          {photoUrl ? 'Change Avatar' : 'Upload Avatar'}
                        </Button>
                      </Stack>
                    </Stack>
                  </label>
                  {photoUrl && (
                    <Button
                      startIcon={<Delete />}
                      onClick={handleDeleteAvatar}
                      color="error"
                      sx={{ mt: 2 }}
                      disabled={saving}
                    >
                      Remove
                    </Button>
                  )}
                </Box>
              </Stack>
            </Paper>
          </Grid2>

          {/* Form Fields Section */}
          <Grid2 size={{ xs: 12, sm: 7, md: 8 }}>
            <Paper sx={{ minHeight: 360, p: 2, pt: 3 }}>
              <Grid2 container spacing={3}>
                <Grid2 size={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    disabled={saving}
                  />
                </Grid2>
                <Grid2 size={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    disabled={saving}
                  />
                </Grid2>
                <Grid2 size={6}>
                  <Autocomplete
                    fullWidth
                    value={selectedGender}
                    onChange={(_, value) => {
                      handleInputChange({
                        target: { name: 'gender', value: value },
                      });
                      setSelectedGender(value);
                    }}
                    renderInput={(params) => <TextField {...params} label="Gender" />}
                    options={['Male', 'Female', 'Other']}
                    disabled={saving}
                  ></Autocomplete>
                </Grid2>
                <Grid2 size={6}>
                  <Autocomplete
                    fullWidth
                    value={selectedCountry}
                    onChange={(_, value) => {
                      handleInputChange({
                        target: { name: 'country', value: value },
                      });
                      setSelectedCountry(value);
                    }}
                    renderInput={(params) => <TextField {...params} label="Country" />}
                    options={countries}
                    disabled={saving}
                  ></Autocomplete>
                </Grid2>
                <Typography variant="subtitle1">Contact Information</Typography>
                <Grid2 size={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </Grid2>
              </Grid2>
            </Paper>
          </Grid2>
        </Grid2>
      </Box>
    </form>
  );
};

export default ProfileSettings;
