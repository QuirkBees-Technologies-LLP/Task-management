'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Button,
} from '@mui/material';
import {
  BusinessOutlined,
  PeopleOutlined,
  FolderOutlined,
  PersonOutlined,
  EmailOutlined,
  EditOutlined,
  SaveOutlined,
  CancelOutlined,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';
import { enqueueSnackbar } from 'notistack';

interface OrganizationData {
  _id: string;
  name: string;
  slug: string;
  status: string;
  planId: string | null;
  planName: string;
  planStartDate: string | null;
  planEndDate: string | null;
  trialStartDate: string | null;
  trialEndDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  owner: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  stats: {
    projectCount: number;
    staffCount: number;
  };
}

const Organization = () => {
  const router = useRouter();
  const { data: userInfo } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = userInfo?.role === 'Admin' || isSuperUser;

  const [organization, setOrganization] = useState<OrganizationData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    if (!isAdmin) {
      setError('Access denied. Admin access required.');
      setLoading(false);
      return;
    }

    fetchOrganization();
  }, [isAdmin]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError('');
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/organization', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.organization) {
        const org = response.data.organization;
        setOrganization(org);
        // Initialize form data - only name is editable
        setFormData({
          name: org.name || '',
        });
      } else {
        setError('Failed to load organization details');
      }
    } catch (error: any) {
      console.error('Error fetching organization:', error);
      setError(error.response?.data?.error || 'Failed to fetch organization details');
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch organization details',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | Date) => {
    if (!dateString) return 'Not set';
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      // Check if date is valid (not NaN and not epoch date)
      if (isNaN(date.getTime()) || date.getTime() === 0) {
        return 'Not set';
      }
      // Check if date is epoch (January 1, 1970) which indicates invalid/null date
      if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
        return 'Not set';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return 'Not set';
    }
  };

  const isValidDate = (dateString: string | null | Date): boolean => {
    if (!dateString) return false;
    try {
      const date = dateString instanceof Date ? dateString : new Date(dateString);
      if (isNaN(date.getTime()) || date.getTime() === 0) {
        return false;
      }
      // Check if date is epoch (January 1, 1970) which indicates invalid/null date
      if (date.getFullYear() === 1970 && date.getMonth() === 0 && date.getDate() === 1) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (organization) {
      setFormData({
        name: organization.name || '',
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      const updatePayload: any = {
        name: formData.name,
      };

      const response = await axios.patch('/api/organization', updatePayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setOrganization(response.data.organization);
        setIsEditing(false);
        enqueueSnackbar({
          message: 'Organization updated successfully',
          variant: 'success',
        });
      }
    } catch (error: any) {
      console.error('Error updating organization:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to update organization',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Typography variant="h6" color="error">
          Access denied. Admin access required to view organization details.
        </Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !organization) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (!organization) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          No organization data found
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(25, 118, 210, 0.1)'
                        : 'rgba(25, 118, 210, 0.08)',
                  }}
                >
                  <FolderOutlined
                    sx={{
                      color: (theme) => theme.palette.primary.main,
                      fontSize: 28,
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {organization.stats.projectCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Projects
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(46, 125, 50, 0.1)'
                        : 'rgba(46, 125, 50, 0.08)',
                  }}
                >
                  <PeopleOutlined
                    sx={{
                      color: '#2e7d32',
                      fontSize: 28,
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {organization.stats.staffCount}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Staff Members
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card
            sx={{
              height: '100%',
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? 'rgba(156, 39, 176, 0.1)'
                        : 'rgba(156, 39, 176, 0.08)',
                  }}
                >
                  <BusinessOutlined
                    sx={{
                      color: '#9c27b0',
                      fontSize: 28,
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={600}>
                    {organization.planName || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Current Plan
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Organization Details */}
        <Grid item xs={12}>
          <Card
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight={600}>
                  Organization Details
                </Typography>
                {!isEditing ? (
                  <Button
                    variant="outlined"
                    startIcon={<EditOutlined />}
                    onClick={handleEdit}
                    size="small"
                  >
                    Edit
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      startIcon={<CancelOutlined />}
                      onClick={handleCancel}
                      size="small"
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<SaveOutlined />}
                      onClick={handleSave}
                      size="small"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </Stack>
                )}
              </Stack>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Organization Name *
                      </Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          size="small"
                          required
                        />
                      ) : (
                        <Typography variant="body1" fontWeight={500}>
                          {organization.name}
                        </Typography>
                      )}
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Created Date
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatDate(organization.createdAt)}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Plan Name
                      </Typography>
                      {/* Plan name is derived from the active subscription and is not editable */}
                      <Typography variant="body1" fontWeight={500}>
                        {organization.planName || 'Not set'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                        Last Updated
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formatDate(organization.updatedAt)}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>

                {isEditing && (
                  <>
                  </>
                )}

                    {!isEditing && (
                      <>
                        {isValidDate(organization.trialStartDate) && isValidDate(organization.trialEndDate) && (
                          <Grid item xs={12} md={6}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                Trial Period
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {formatDate(organization.trialStartDate)} -{' '}
                                {formatDate(organization.trialEndDate)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}

                        {isValidDate(organization.planStartDate) && isValidDate(organization.planEndDate) && (
                          <Grid item xs={12} md={6}>
                            <Box>
                              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                                Plan Period
                              </Typography>
                              <Typography variant="body1" fontWeight={500}>
                                {formatDate(organization.planStartDate)} -{' '}
                                {formatDate(organization.planEndDate)}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </>
                    )}
              </Grid>

              {organization.owner && (
                <>
                  <Divider sx={{ my: 3 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={600} mb={2}>
                      Owner Information
                    </Typography>
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                          <PersonOutlined fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Name:
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {organization.owner.firstName} {organization.owner.lastName}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <EmailOutlined fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            Email:
                          </Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {organization.owner.email}
                          </Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default Organization;

