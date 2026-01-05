'use client';
import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid2,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import { ErrorMessage, Field, Form, Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { useRouter } from 'next/navigation';

// Custom validation function for end date
const validateEndDate = (value: string) => {
  if (!value) return undefined; // Allow empty for optional fields
  
  // Only validate if date is complete (YYYY-MM-DD format = 10 characters)
  if (value.length === 10) {
    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      return 'Invalid date format. Please enter a valid date.';
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Check if date is valid (handles invalid dates like Feb 30)
    if (!(date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day)) {
      return 'Invalid date format. Please enter a valid date.';
    }

    // Validate due date - must be a future date using normalized Date objects
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    
    // Normalize both dates to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return 'End date cannot be in the past. Please select a future date.';
    }
  } else if (value.length > 0 && value.length < 10) {
    // Date is incomplete, don't validate yet
    return undefined;
  }
  
  return undefined;
};

const validationSchema = Yup.object().shape({
  name: Yup.string().required('Name is required').max(100, 'Name must be at most 100 characters'),
  description: Yup.string()
    .required('Description is required')
    .max(500, 'Description must be at most 500 characters'),
  startDate: Yup.date().required('Start date is required'),
  endDate: Yup.string()
    .required('End date is required')
    .test('is-future-date', 'End date cannot be in the past. Please select a future date.', function(value) {
      if (!value || value.length !== 10) return true; // Don't validate incomplete dates
      const error = validateEndDate(value);
      return error === undefined; // Return true if no error (valid future date)
    })
    .test('is-after-start', 'End date must be after start date', function(value) {
      const { startDate } = this.parent;
      if (!value || !startDate || value.length !== 10) return true;
      const endDate = new Date(value);
      const start = new Date(startDate);
      endDate.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      return endDate >= start;
    }),
  status: Yup.string().required('Status is required'),
});

function ProjectModalWithFields({ content, mode, visible, onClose }) {
  const { submitForm } = useFormikContext();

  return (
    <Dialog open={visible} onClose={onClose}>
      <DialogTitle>{mode === 'add' ? 'Add Project' : 'Edit Project'}</DialogTitle>
      <DialogContent style={{ paddingTop: 10 }}>{content}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={() => submitForm()} type="submit" variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ProjectModal({
  visible,
  setVisible,
  mode,
  initialValues,
  setInitialValues,
  onSave,
}) {
  const router = useRouter();
  const [clients, setClients] = useState<Array<{ _id: string; name: string; clientName?: string }>>([]);
  const [loadingClients, setLoadingClients] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      fetchClients();
    }
  }, [visible]);

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/clients?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const clientList = (response.data.clients || []).map((c: any) => ({
          _id: c._id,
          name: c.name || c.clientName || '',
          clientName: c.name || c.clientName || '',
        }));
        setClients(clientList);
      }
    } catch (error: any) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
    setInitialValues({
      id: '',
      name: '',
      clientName: '',
      description: '',
      status: '',
      startDate: '',
      endDate: '',
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      if (mode === 'edit' && initialValues.id) {
        // Update existing project
        await axios.patch(
          `/api/projects/${initialValues.id}`,
          {
            name: values.name,
            clientName: values.clientName || '',
            description: values.description,
            status: values.status,
            dueDate: values.endDate,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        enqueueSnackbar('Project updated successfully!', { variant: 'success' });
      } else {
        // Create new project
        await axios.post(
          '/api/projects',
          {
            name: values.name,
            clientName: values.clientName || '',
            description: values.description,
            status: values.status,
            dueDate: values.endDate,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        enqueueSnackbar('Project created successfully!', { variant: 'success' });
      }

      setVisible(false);
      if (onSave) {
        onSave();
      }
    } catch (error: any) {
      enqueueSnackbar({
        message: error.response?.data?.error || `Failed to ${mode} project`,
        variant: 'error',
      });
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {({ errors, touched, values, handleChange, handleBlur, setFieldError, setFieldValue }) => {
        // Custom handler for endDate with 2-second error timeout
        // Always update the field value first to prevent date/month from disappearing
        const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const dateValue = e.target.value;
          
          // ALWAYS update the field value first
          setFieldValue('endDate', dateValue);
          
          // Clear any existing error after 2 seconds if date is valid
          if (dateValue && dateValue.length === 10) {
            const validationError = validateEndDate(dateValue);
            if (validationError) {
              setFieldError('endDate', validationError);
              setTimeout(() => {
                setFieldError('endDate', undefined);
              }, 2000);
            } else {
              setFieldError('endDate', undefined);
            }
          } else if (dateValue && dateValue.length < 10) {
            // Date is incomplete, clear errors
            setFieldError('endDate', undefined);
          } else {
            // Empty value
            setFieldError('endDate', undefined);
          }
        };

        return (
          <ProjectModalWithFields
            mode={mode}
            visible={visible}
            onClose={handleClose}
            content={
              <Form>
                <Grid2 container spacing={2}>
                  <Grid2 size={6}>
                    <Field
                      as={TextField}
                      name="name"
                      label="Project Name"
                      variant="outlined"
                      fullWidth
                      error={touched.name && errors.name}
                      helperText={<ErrorMessage name="name" />}
                    />
                  </Grid2>
                  <Grid2 size={6}>
                    <FormControl fullWidth>
                      <InputLabel id="client-name-label">Client Name</InputLabel>
                      <Select
                        name="clientName"
                        labelId="client-name-label"
                        label="Client Name"
                        value={values.clientName || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={loadingClients}
                      >
                        <MenuItem value="">
                          <em>None</em>
                        </MenuItem>
                        {clients.map((client) => (
                          <MenuItem key={client._id} value={client.clientName || client.name}>
                            {client.clientName || client.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {loadingClients && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
                          <CircularProgress size={20} />
                        </Box>
                      )}
                    </FormControl>
                  </Grid2>
                  <Grid2 size={6}>
                    <FormControl fullWidth error={Boolean(touched.status && errors.status)}>
                      <InputLabel id="status-label">Status</InputLabel>
                      <Field
                        as={Select}
                        name="status"
                        labelId="status-label"
                        label="Status"
                        value={values.status}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <MenuItem value="">
                          <em>Select status</em>
                        </MenuItem>
                        <MenuItem value="Planning">Planning</MenuItem>
                        <MenuItem value="In Progress">In Progress</MenuItem>
                        <MenuItem value="Completed">Completed</MenuItem>
                      </Field>
                      <ErrorMessage name="status" component={Typography} />
                    </FormControl>
                  </Grid2>
                  <Grid2 size={6}>
                    <Field
                      as={TextField}
                      name="startDate"
                      label="Start Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                      error={touched.startDate && errors.startDate}
                      helperText={<ErrorMessage name="startDate" />}
                    />
                  </Grid2>
                  <Grid2 size={6}>
                    <Field
                      as={TextField}
                      name="endDate"
                      label="End Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      inputProps={{
                        min: new Date().toISOString().split('T')[0], // Set minimum date to today
                      }}
                      fullWidth
                      onChange={handleEndDateChange}
                      error={touched.endDate && errors.endDate}
                      helperText={errors.endDate || ''}
                    />
                  </Grid2>
                <Grid2 size={12}>
                  <Field
                    as={TextField}
                    name="description"
                    label="Description"
                    variant="outlined"
                    multiline
                    rows={4}
                    fullWidth
                    error={touched.description && errors.description}
                    helperText={<ErrorMessage name="description" />}
                  />
                </Grid2>
              </Grid2>
            </Form>
          }
        />
        );
      }}
    </Formik>
  );
}
