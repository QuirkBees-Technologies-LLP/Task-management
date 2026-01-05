'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  CircularProgress,
  Stack,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';

const CreateProjectPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    dueDate: '',
    status: 'Pending',
  });

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Validate due date - must be a future date
    if (name === 'dueDate') {
      // ALWAYS update the form state first to prevent date/month from disappearing
      setFormData((prev) => ({ ...prev, [name]: value }));

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
      setFormData((prev) => ({ ...prev, [name]: value }));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.description) {
      enqueueSnackbar({
        message: 'Name and description are required',
        variant: 'error',
      });
      return;
    }

    // Prevent submission if past date is selected
    if (isPastDate) {
      enqueueSnackbar({
        message: 'Please select a future date for the due date',
        variant: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.post(
        '/api/projects',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        enqueueSnackbar({
          message: 'Project created successfully',
          variant: 'success',
        });
        router.push('/projects');
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to create project',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="Create Project" />

      <Box sx={{ mt: 3, maxWidth: 800 }}>
        <Paper sx={{ p: 3 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                name="name"
                label="Project Name"
                value={formData.name}
                onChange={handleChange}
                required
                fullWidth
                variant="outlined"
              />

              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                required
                fullWidth
                multiline
                rows={4}
                variant="outlined"
              />

              <TextField
                name="dueDate"
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  min: new Date().toISOString().split('T')[0], // Set minimum date to today
                }}
                error={!!dueDateError}
                helperText={dueDateError || ''}
                variant="outlined"
              />

              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                  label="Status"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Completed">Completed</MenuItem>
                </Select>
              </FormControl>

              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={() => router.push('/projects')}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || !formData.name || !formData.description || isPastDate}
                  startIcon={loading && <CircularProgress size={20} color="inherit" />}
                >
                  Create Project
                </Button>
              </Stack>
            </Stack>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default CreateProjectPage;


