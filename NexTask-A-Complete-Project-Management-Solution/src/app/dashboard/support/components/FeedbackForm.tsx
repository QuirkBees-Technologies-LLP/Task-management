'use client';
import React, { useState } from 'react';
import { TextField, Button, Box, Grid2, CircularProgress, Typography } from '@mui/material';
import { MailOutline, AttachFile } from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { submitFeedback } from '@/redux/slices';
import { selectFeedback } from '@/redux/selectors';
import { enqueueSnackbar } from 'notistack';

const MIN_LENGTH = 250;
const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  feedback: '',
};

const FeedbackForm = () => {
  const dispatch = useDispatch();
  const [values, setValues] = useState<any>(initialValues);
  const [error, setError] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);

  const { saving } = useSelector(selectFeedback);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev: any) => ({ ...prev, [name]: value }));
    if (name === 'feedback' && value.length >= MIN_LENGTH) {
      setError(false);
    }
  };

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/gif',
    'image/webp',
  ];
  const MAX_FILE_SIZE_MB = 50;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        enqueueSnackbar({
          variant: 'error',
          message: 'Unsupported file type. Please upload a valid document or image.',
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        enqueueSnackbar({
          variant: 'error',
          message: 'File size exceeds 5MB limit.',
        });
        return;
      }
      setAttachment(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (values?.feedback?.length < MIN_LENGTH) {
      setError(true);
      return;
    }

    // Combine all form data including the file
    const formData = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      // Ensure value is a string before appending
      formData.append(key, String(value));
    });
    if (attachment) {
      formData.append('attachment', attachment);
    }

    dispatch(submitFeedback({ formData, setValues, setAttachment }));
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mb: 3 }}>
      <Grid2 container spacing={2}>
        <Grid2 size={{ md: 8, lg: 6, sm: 12, xs: 12 }}>
          <Grid2 container spacing={2}>
            <Grid2 size={6}>
              <TextField
                name="firstName"
                type="text"
                label="First Name"
                required
                fullWidth
                margin="dense"
                value={values?.firstName}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid2>
            <Grid2 size={6}>
              <TextField
                name="lastName"
                type="text"
                label="Last Name"
                required
                fullWidth
                margin="dense"
                value={values?.lastName}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid2>
            <Grid2 size={12}>
              <TextField
                name="email"
                type="email"
                label="Your Email"
                required
                fullWidth
                margin="dense"
                value={values?.email}
                onChange={handleInputChange}
                disabled={saving}
              />
            </Grid2>
            <Grid2 size={12}>
              <TextField
                label="Your Feedback"
                variant="outlined"
                name="feedback"
                fullWidth
                multiline
                minRows={4}
                value={values?.feedback}
                onChange={handleInputChange}
                required
                error={error}
                helperText={error ? 'Feedback must be at least 250 characters' : ''}
                disabled={saving}
              />
            </Grid2>
            <Grid2 size={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<AttachFile />}
                disabled={saving}
              >
                Upload Attachment
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf,.png,.jpg,.jpeg,.docx"
                />
              </Button>
              {attachment && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected file: {attachment.name}
                </Typography>
              )}
            </Grid2>
          </Grid2>
        </Grid2>
      </Grid2>

      <Button
        startIcon={saving ? <CircularProgress size={15} color="inherit" /> : <MailOutline />}
        type="submit"
        variant="contained"
        color="primary"
        sx={{ mt: 2 }}
      >
        Submit
      </Button>
    </Box>
  );
};

export default FeedbackForm;
