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
  Autocomplete,
  Divider,
  Stack,
  IconButton,
} from '@mui/material';
import { AttachFile, CloseOutlined, Delete, Visibility } from '@mui/icons-material';
import RichTextEditor from '@/app/dashboard/tasks/components/RichTextEditor';
import FileAttachmentDialog from '@/app/dashboard/tasks/components/FileAttachmentDialog';
import type { TaskAttachment } from '@/app/dashboard/tasks/types';
import { ErrorMessage, Field, Form, Formik, useFormikContext } from 'formik';
import * as Yup from 'yup';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import PrioritySelect from '@/app/dashboard/tasks/components/PrioritySelect';
import { jwtDecode } from 'jwt-decode';

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
    .test('is-future-date', 'End date cannot be in the past. Please select a future date.', function (value) {
      if (!value || value.length !== 10) return true; // Don't validate incomplete dates
      const error = validateEndDate(value);
      return error === undefined; // Return true if no error (valid future date)
    })
    .test('is-after-start', 'End date must be after start date', function (value) {
      const { startDate } = this.parent;
      if (!value || !startDate || value.length !== 10) return true;
      const endDate = new Date(value);
      const start = new Date(startDate);
      endDate.setHours(0, 0, 0, 0);
      start.setHours(0, 0, 0, 0);
      return endDate >= start;
    }),
  status: Yup.string().required('Status is required'),
  priority: Yup.string().oneOf(['Low', 'Medium', 'High']).optional(),
  assignee: Yup.array().of(Yup.string()).optional(),
  attachments: Yup.array().of(
    Yup.object().shape({
      fileName: Yup.string().required(),
      fileUrl: Yup.string().required(),
    })
  ).optional(),
});

function ProjectModalWithFields({ content, mode, visible, onClose }) {
  const { submitForm } = useFormikContext();

  return (
    <Dialog open={visible} onClose={onClose}>
      <DialogTitle sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>{mode === 'add' ? 'Add Project' : 'Edit Project'}
        <IconButton onClick={onClose} size="small">
          <CloseOutlined />
        </IconButton>
      </DialogTitle>
      <DialogContent style={{ paddingTop: 24 }} dividers>{content}</DialogContent>
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          borderColor: 'divider',
        }}
      >
        {/* ================= CLOSE ================= */}
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            py: 1.25,
            fontWeight: 500,

            color: (theme) => theme.palette.text.primary,
            borderColor: (theme) => theme.palette.divider,

            backgroundColor: 'transparent',

            '&:hover': {
              backgroundColor: (theme) => theme.palette.action.hover,
              borderColor: (theme) => theme.palette.text.secondary,
            },
          }}
        >
          Close
        </Button>

        {/* ================= SAVE ================= */}
        <Button
          onClick={submitForm}
          type="submit"
          variant="contained"
          sx={{
            textTransform: 'none',
            borderRadius: '8px',
            px: 3,
            py: 1.25,
            fontWeight: 500,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.grey[100]
                : theme.palette.grey[900],

            color: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.grey[900]
                : '#ffffff',

            boxShadow: 'none',

            '&:hover': {
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[200]
                  : '#000000',
              boxShadow: 'none',
            },
          }}
        >
          Save Changes
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
  const [users, setUsers] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState<boolean>(false);

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

  // Fetch users for Assignee field (same logic as Tasks page)
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const token = safeLocalStorageGet(accessTokenKey);
        if (!token) return;

        const decoded: any = jwtDecode(token);
        const canUseAdminUsersApi = decoded?.role === 'Admin' || decoded?.superuser === true;

        // Try staff API first, fallback to users API
        try {
          const response = await axios.get('/api/staff?limit=1000', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.success) {
            const staffUsers = (response.data.staff || []).map((s: any) => ({
              _id: s._id.toString(),
              firstName: s.firstName || '',
              lastName: s.lastName || '',
              email: s.email || '',
            }));
            setUsers(staffUsers);
            return;
          }
        } catch (e) {
          // Fallback to users API
        }

        // Only Admins can access /api/users (without currentUser=true). For Regular users,
        // calling it returns 401 which triggers the global "Session expired" logout.
        if (canUseAdminUsersApi) {
          const usersResponse = await axios.get('/api/users', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (Array.isArray(usersResponse.data)) {
            const usersList = usersResponse.data.map((u: any) => ({
              _id: typeof u._id === 'string' ? u._id : (u._id?.toString() || ''),
              firstName: u.firstName || '',
              lastName: u.lastName || '',
              email: u.email || '',
            }));
            setUsers(usersList);
          }
        } else {
          // Regular user: no fallback (staff API is org-scoped and should be the source of truth)
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users for project assignee:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (visible) {
      fetchUsers();
    }
  }, [visible]);

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
      priority: 'High',
      assignee: [],
      attachments: [],
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
            priority: values.priority || 'High',
            assignee: values.assignee || [],
            attachments: values.attachments || [],
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
            priority: values.priority || 'High',
            assignee: values.assignee || [],
            attachments: values.attachments || [],
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

        const handleAddAttachment = (attachment: {
          fileName: string;
          fileUrl: string;
          fileType: string;
          fileSize?: number;
          attachmentType: 'file' | 'url' | 'google_drive' | 'onedrive' | 'box' | 'dropbox';
        }) => {
          const newAttachment: TaskAttachment = {
            fileName: attachment.fileName,
            fileUrl: attachment.fileUrl,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            attachmentType: attachment.attachmentType,
            uploadedAt: new Date().toISOString(),
          };
          const current = (values.attachments as TaskAttachment[] | undefined) || [];
          setFieldValue('attachments', [...current, newAttachment]);
        };

        const handleDeleteAttachment = (index: number) => {
          const current = (values.attachments as TaskAttachment[] | undefined) || [];
          const updated = current.filter((_, i) => i !== index);
          setFieldValue('attachments', updated);
        };

        return (
          <>
            <ProjectModalWithFields
              mode={mode}
              visible={visible}
              onClose={handleClose}
              content={
                <Form>
                  <Grid2 container spacing={2}>
                    <Grid2 size={{ xs: 12, md: 6 }}>
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
                    <Grid2 size={{ xs: 12, md: 6 }}>
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
                    <Grid2 size={12}>
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
                    <Grid2 size={12}>
                      <PrioritySelect
                        value={values.priority || 'High'}
                        onChange={(value) => setFieldValue('priority', value)}
                        fullWidth
                        margin="dense"
                        projectId={values.id}
                      />
                    </Grid2>
                    <Grid2 size={{ xs: 12, md: 6 }}>
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
                    <Grid2 size={{ xs: 12, md: 6 }}>
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
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600, fontSize: '13px' }}>
                          Description
                        </Typography>
                        <RichTextEditor
                          value={values.description || ''}
                          onChange={(value) => {
                            setFieldValue('description', value);
                          }}
                          placeholder="Type / for menu"
                        />
                        {touched.description && errors.description && (
                          <Typography variant="caption" color="error">
                            {errors.description as string}
                          </Typography>
                        )}
                      </Box>
                    </Grid2>

                    <Grid2 size={12}>
                      <Autocomplete
                        multiple
                        options={users}
                        getOptionLabel={(option) =>
                          `${option.firstName} ${option.lastName}`.trim() || option.email
                        }
                        isOptionEqualToValue={(option, value) => option._id === value._id}
                        value={users.filter((user) =>
                          (values.assignee || []).includes(user._id)
                        )}
                        onChange={(event, newValue) => {
                          const assigneeIds = newValue.map((user) => user._id);
                          setFieldValue('assignee', assigneeIds);
                        }}
                        filterSelectedOptions
                        loading={loadingUsers}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            margin="dense"
                            label="Assignee"
                            placeholder="Search users..."
                            InputProps={{
                              ...params.InputProps,
                              endAdornment: (
                                <>
                                  {loadingUsers ? <CircularProgress size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                          />
                        )}
                      />
                    </Grid2>

                  <Grid2 size={12}>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          Attachments {(values.attachments && (values.attachments as TaskAttachment[]).length)
                            ? `(${(values.attachments as TaskAttachment[]).length})`
                            : '(0)'}
                        </Typography>
                        <Button
                          startIcon={<AttachFile />}
                          onClick={() => setAttachmentDialogOpen(true)}
                          size="small"
                          variant="outlined"
                        >
                          Attach
                        </Button>
                      </Stack>
                      {values.attachments && (values.attachments as TaskAttachment[]).length > 0 ? (
                        <Stack spacing={0.5}>
                          {(values.attachments as TaskAttachment[]).map((attachment, index) => (
                            <Stack
                              key={index}
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              sx={{
                                p: 1,
                                borderRadius: 1,
                                bgcolor: 'action.hover',
                              }}
                            >
                              <AttachFile fontSize="small" sx={{ color: 'text.secondary' }} />
                              <Typography
                                variant="body2"
                                sx={{
                                  flex: 1,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {attachment.fileName}
                              </Typography>
                              <Button
                                size="small"
                                href={attachment.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                startIcon={<Visibility />}
                                sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                              >
                                View
                              </Button>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAttachment(index)}
                                color="error"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Stack>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                          No attachments
                        </Typography>
                      )}
                    </Box>
                  </Grid2>
                </Grid2>
              </Form>
            }
          />

            <FileAttachmentDialog
              open={attachmentDialogOpen}
              onClose={() => setAttachmentDialogOpen(false)}
              onAddAttachment={handleAddAttachment}
            />
          </>
        );
      }}
    </Formik>
  );
}
