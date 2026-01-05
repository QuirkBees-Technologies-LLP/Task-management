'use client';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Grid,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { InvoiceDialogProps } from '../types';
import { accessTokenKey } from '@/utils/constants';
import { safeLocalStorageGet } from '@/utils/helpers';

export default function InvoiceDialog({
  isDialogOpen,
  handleCloseDialog,
  isEdit,
  invoiceForm,
  setInvoiceForm,
  handleSaveInvoice,
  saving = false,
}: InvoiceDialogProps) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState<boolean>(false);

  const [dueDateError, setDueDateError] = useState<string>('');
  const [dueDateErrorTimeout, setDueDateErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPastDate, setIsPastDate] = useState<boolean>(false);

  // Helper function to validate date format (YYYY-MM-DD)
  const isValidDateFormat = (dateString: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Check if date is valid (handles invalid dates like Feb 30)
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleFormChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    
    // Special handling for amount field
    if (name === 'amount') {
      // Parse the number value, default to 0 if empty or invalid
      const numValue = value === '' ? 0 : (isNaN(parseFloat(value)) ? 0 : parseFloat(value));
      setInvoiceForm((prevForm) => ({ ...prevForm, [name]: numValue }));
    } else if (name === 'dueDate') {
      // ALWAYS update the form state first to prevent date/month from disappearing
      setInvoiceForm((prevForm) => ({ ...prevForm, [name]: value }));

      // Clear any existing timeout
      if (dueDateErrorTimeout) {
        clearTimeout(dueDateErrorTimeout);
        setDueDateErrorTimeout(null);
      }

      // Only validate if date is complete (YYYY-MM-DD format = 10 characters)
      if (value && value.length === 10) {
        // First validate date format
        if (!isValidDateFormat(value)) {
          setDueDateError('Invalid date format. Please enter a valid date.');
          setIsPastDate(false);
          const timeout = setTimeout(() => setDueDateError(''), 2000);
          setDueDateErrorTimeout(timeout);
          return;
        }

        // Validate due date - must be a future date using normalized Date objects
        const [year, month, day] = value.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const today = new Date();
        
        // Normalize both dates to start of day for accurate comparison
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          setDueDateError('Due date cannot be in the past. Please select a future date.');
          setIsPastDate(true);
          const timeout = setTimeout(() => {
            setDueDateError('');
            setIsPastDate(false);
          }, 2000);
          setDueDateErrorTimeout(timeout);
        } else {
          setDueDateError('');
          setIsPastDate(false);
        }
      } else if (value && value.length < 10) {
        // Date is incomplete, don't validate yet, just clear errors
        setDueDateError('');
        setIsPastDate(false);
      } else {
        // Empty value
        setDueDateError('');
        setIsPastDate(false);
      }
    } else {
      setInvoiceForm((prevForm) => ({ ...prevForm, [name]: value }));
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dueDateErrorTimeout) {
        clearTimeout(dueDateErrorTimeout);
      }
    };
  }, [dueDateErrorTimeout]);

  const handleAmountFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when focusing on amount field to make it easy to replace
    event.target.select();
  };

  // Fetch projects for project dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoadingProjects(true);
        const token = safeLocalStorageGet(accessTokenKey);
        if (!token) return;

        const response = await axios.get('/api/projects', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const projectList = response.data?.projects || response.data || [];
        setProjects(projectList);
      } catch (error: any) {
        console.error('Error fetching projects for invoice form:', error);
        enqueueSnackbar({
          message: error.response?.data?.error || 'Failed to load projects',
          variant: 'error',
        });
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, []);

  const clientName = invoiceForm.clientName || invoiceForm.project || '';

  return (
    <Dialog open={isDialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
      <DialogTitle>{isEdit ? 'Edit Invoice' : 'Add Invoice'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          margin="normal"
          label="Invoice Number"
          value={invoiceForm.invoiceNumber || ''}
          fullWidth
          InputProps={{
            readOnly: true,
          }}
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="normal"
              label="Client Name"
              name="clientName"
              value={clientName}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              margin="normal"
              label="Client Project"
              name="clientProject"
              value={invoiceForm.clientProject || ''}
              onChange={handleFormChange}
              fullWidth
              select
              disabled={loadingProjects}
              helperText={loadingProjects ? 'Loading projects...' : ''}
              InputProps={{
                endAdornment: loadingProjects ? <CircularProgress size={18} /> : null,
              }}
            >
              {projects.length === 0 && !loadingProjects ? (
                <MenuItem disabled value="">
                  No projects available
                </MenuItem>
              ) : (
                projects.map((proj) => (
                  <MenuItem key={proj._id || proj.id || proj.name} value={proj.name || proj.projectName || proj.title || ''}>
                    {proj.name || proj.projectName || proj.title || ''}
                  </MenuItem>
                ))
              )}
            </TextField>
          </Grid>
        </Grid>
        <TextField
          margin="normal"
          label="Client Email"
          name="clientEmail"
          type="email"
          value={invoiceForm.clientEmail || ''}
          onChange={handleFormChange}
          fullWidth
        />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              margin="normal"
              label="Amount"
              name="amount"
              value={invoiceForm.amount === 0 || invoiceForm.amount === undefined || invoiceForm.amount === null ? '' : invoiceForm.amount}
              onChange={handleFormChange}
              onFocus={handleAmountFocus}
              type="number"
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
              placeholder="0"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              margin="normal"
              label="Currency"
              name="currency"
              value={invoiceForm.currency || 'USD'}
              onChange={handleFormChange}
              fullWidth
              select
            >
              <MenuItem value="USD">$ (USD)</MenuItem>
              <MenuItem value="EUR">€ (EUR)</MenuItem>
              <MenuItem value="GBP">£ (GBP)</MenuItem>
              <MenuItem value="INR">₹ (INR)</MenuItem>
              <MenuItem value="JPY">¥ (JPY)</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <TextField
          margin="normal"
          label="Status"
          name="status"
          value={invoiceForm.status || 'Pending'}
          onChange={handleFormChange}
          select
          fullWidth
        >
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Paid">Paid</MenuItem>
          <MenuItem value="Overdue">Overdue</MenuItem>
          <MenuItem value="draft">Draft</MenuItem>
        </TextField>
        <TextField
          margin="normal"
          label="Due Date"
          name="dueDate"
          type="date"
          value={invoiceForm.dueDate || ''}
          onChange={handleFormChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
          inputProps={{
            min: new Date().toISOString().split('T')[0], // Set minimum date to today
          }}
          error={!!dueDateError}
          helperText={dueDateError || ''}
        />
        <TextField
          margin="normal"
          label="Notes"
          name="notes"
          value={invoiceForm.notes || ''}
          onChange={handleFormChange}
          fullWidth
          multiline
          rows={3}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog} disabled={saving}>
          Cancel
        </Button>
        <Button 
          onClick={handleSaveInvoice} 
          color="primary" 
          variant="contained" 
          disabled={saving || isPastDate}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
