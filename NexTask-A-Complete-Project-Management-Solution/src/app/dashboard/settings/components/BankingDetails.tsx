'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Alert,
  MenuItem,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';

interface BankingDetailsData {
  accountHolder: string;
  accountNumber: string;
  bankName: string;
  accountType: string;
}

const BankingDetails: React.FC = () => {
  const { data: currentUser } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = currentUser?.role === 'Admin' || isSuperUser;
  const isReadOnly = !isAdmin;

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [formData, setFormData] = useState<BankingDetailsData>({
    accountHolder: '',
    accountNumber: '',
    bankName: '',
    accountType: '',
  });

  useEffect(() => {
    fetchBankingDetails();
  }, []);

  const fetchBankingDetails = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/settings/banking', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setFormData(response.data.settings || {
          accountHolder: '',
          accountNumber: '',
          bankName: '',
          accountType: '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching banking details:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch banking details',
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      await axios.put(
        '/api/settings/banking',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      enqueueSnackbar({
        message: 'Banking details saved successfully!',
        variant: 'success',
      });

      fetchBankingDetails();
    } catch (error: any) {
      console.error('Error saving banking details:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to save banking details',
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
          Banking Details
        </Typography>
        <Stack spacing={2}>
          <CircularProgress size={24} />
          <Typography variant="body2">Loading banking details...</Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h6" gutterBottom>
            Banking Details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure banking information for invoices and documents
          </Typography>
        </Box>

        {isReadOnly && (
          <Alert severity="info">
            You don't have permission to edit banking details. Contact an administrator.
          </Alert>
        )}

        {/* Account Holder */}
        <TextField
          label="Account Holder"
          name="accountHolder"
          value={formData.accountHolder}
          onChange={handleInputChange}
          fullWidth
          disabled={isReadOnly || saving}
          placeholder="ACCOUNTS HOLDER NAME"
        />

        {/* Account Number */}
        <TextField
          label="Account Number"
          name="accountNumber"
          value={formData.accountNumber}
          onChange={handleInputChange}
          fullWidth
          disabled={isReadOnly || saving}
          placeholder="0000000000000"
        />

        {/* Bank Name */}
        <TextField
          label="Bank"
          name="bankName"
          value={formData.bankName}
          onChange={handleInputChange}
          fullWidth
          disabled={isReadOnly || saving}
          placeholder="Bank Name"
        />

        {/* Account Type */}
        <TextField
          label="Account Type"
          name="accountType"
          value={formData.accountType}
          onChange={handleInputChange}
          select
          fullWidth
          disabled={isReadOnly || saving}
        >
          <MenuItem value="Savings">Savings</MenuItem>
          <MenuItem value="Current">Current</MenuItem>
          <MenuItem value="Checking">Checking</MenuItem>
          <MenuItem value="Business">Business</MenuItem>
        </TextField>

        {/* Save Button (Admin Only) */}
        {!isReadOnly && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving && <CircularProgress size={20} color="inherit" />}
            >
              {saving ? 'Saving...' : 'Save Banking Details'}
            </Button>
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default BankingDetails;

