'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Stack,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';

interface CompanySettingsData {
  companyName: string;
  logoUrl: string;
  address: string;
  email: string;
  phone: string;
  taxNumber: string;
  website: string;
}

const CompanySettings: React.FC = () => {
  const { data: currentUser } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = currentUser?.role === 'Admin' || isSuperUser;
  const isReadOnly = !isAdmin;

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<CompanySettingsData>({
    companyName: '',
    logoUrl: '',
    address: '',
    email: '',
    phone: '',
    taxNumber: '',
    website: '',
  });

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/settings/company', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFormData(response.data.settings || {
          companyName: '',
          logoUrl: '',
          address: '',
          email: '',
          phone: '',
          taxNumber: '',
          website: '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching company settings:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch company settings',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        enqueueSnackbar({
          message: 'Please upload an image file',
          variant: 'error',
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        enqueueSnackbar({
          message: 'Image size should be less than 5MB',
          variant: 'error',
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target) {
          // Store as data URL (for now - in production, upload to cloud storage)
          setFormData((prev) => ({ ...prev, logoUrl: event.target.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleDeleteLogo = () => {
    setFormData((prev) => ({ ...prev, logoUrl: '' }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      await axios.put(
        '/api/settings/company',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      enqueueSnackbar({
        message: 'Company settings saved successfully!',
        variant: 'success',
      });

      fetchCompanySettings();
    } catch (error: any) {
      console.error('Error saving company settings:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to save company settings',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Company Settings
        </Typography>
        <Stack spacing={2}>
          <CircularProgress size={24} />
          <Typography variant="body2">Loading company settings...</Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Company Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure company information for invoices and documents
          </Typography>
        </Box>

        {isReadOnly && (
          <Alert severity="info">
            You don't have permission to edit company settings. Contact an administrator.
          </Alert>
        )}

        {/* Logo Upload Section */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Company Logo
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            {formData.logoUrl ? (
              <>
                <Avatar
                  src={formData.logoUrl}
                  alt="Company Logo"
                  sx={{ width: 100, height: 100 }}
                  variant="rounded"
                />
                {!isReadOnly && (
                  <IconButton color="error" onClick={handleDeleteLogo}>
                    <Delete />
                  </IconButton>
                )}
              </>
            ) : (
              <Avatar
                sx={{ width: 100, height: 100, bgcolor: 'grey.300' }}
                variant="rounded"
              >
                <Typography variant="caption">No Logo</Typography>
              </Avatar>
            )}
            {!isReadOnly && (
              <Box>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="logo-upload"
                  type="file"
                  onChange={handleLogoUpload}
                />
                <label htmlFor="logo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<CloudUpload />}
                    disabled={saving}
                  >
                    Upload Logo
                  </Button>
                </label>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Company Name */}
        <TextField
          label="Company Name"
          name="companyName"
          value={formData.companyName}
          onChange={handleInputChange}
          fullWidth
          required
          disabled={isReadOnly || saving}
        />

        {/* Address */}
        <TextField
          label="Company Address"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          fullWidth
          multiline
          rows={3}
          disabled={isReadOnly || saving}
        />

        {/* Email and Phone */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Company Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            fullWidth
            disabled={isReadOnly || saving}
          />
          <TextField
            label="Company Phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            fullWidth
            disabled={isReadOnly || saving}
          />
        </Stack>

        {/* Website */}
        <TextField
          label="Company Website"
          name="website"
          type="url"
          value={formData.website}
          onChange={handleInputChange}
          fullWidth
          placeholder="https://www.example.com"
          disabled={isReadOnly || saving}
        />

        {/* Tax Number */}
        <TextField
          label="Tax / GST Number"
          name="taxNumber"
          value={formData.taxNumber}
          onChange={handleInputChange}
          fullWidth
          disabled={isReadOnly || saving}
        />

        {/* Save Button (Admin Only) */}
        {!isReadOnly && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !formData.companyName.trim()}
              startIcon={saving && <CircularProgress size={20} color="inherit" />}
            >
              {saving ? 'Saving...' : 'Save Company Settings'}
            </Button>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default CompanySettings;

