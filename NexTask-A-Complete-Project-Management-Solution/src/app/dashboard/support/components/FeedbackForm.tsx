'use client';
import React, { useState } from 'react';
import { TextField, Button, Box, Grid2, CircularProgress, Typography, Card, Avatar, Chip, Dialog, IconButton, Select, MenuItem, FormControl, Menu, DialogActions, DialogContent, DialogContentText, DialogTitle, InputAdornment } from '@mui/material';
import { MailOutline, AttachFile, MoreVert, Edit, Delete, Visibility } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from 'react-redux';
import { submitFeedback } from '@/redux/slices';
import { selectFeedback, selectCurrentUser, selectSuperuser } from '@/redux/selectors';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';

// Minimum characters required for feedback text.
const MIN_LENGTH = 20;
const initialValues = {
  firstName: '',
  lastName: '',
  email: '',
  feedback: '',
};

interface FeedbackFormProps {
  name?: string;
  time?: string;
  message?: string;
  avatar?: string;
  status?: string;
  newticket?: string;
  priority?: string;
  lowpriority?: string;
  mediumpriority?: string;
  department?: string;
  subject?: string;
  ticketId?: string;
  attachments?: Array<{
    fileName?: string;
    fileUrl?: string;
    fileType?: string;
    fileSize?: number;
  }>;
  onReload?: () => void;
}

const FeedbackForm = (props: FeedbackFormProps) => {
  const {
    name,
    time,
    message,
    avatar,
    status,
    newticket,
    priority,
    lowpriority,
    mediumpriority,
    department,
    subject,
    ticketId,
    attachments,
  } = props;
  const dispatch = useDispatch();
  const [values, setValues] = useState<any>(initialValues);
  const [error, setError] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [active, setActive] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [editMode, setEditMode] = useState(false);
  const [editValues, setEditValues] = useState<any>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: userInfo } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);

  // Check if user is admin (Admin role or Superuser)
  const isAdmin = userInfo?.role === 'Admin' || isSuperUser;

  // Local state for saving
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev: any) => ({ ...prev, [name]: value }));
    if (name === 'feedback' && value.length >= MIN_LENGTH) {
      setError(false);
    }
  };

  const MAX_FILE_SIZE_MB = 50;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        enqueueSnackbar({
          variant: 'error',
          message: 'File size exceeds 50MB limit.',
        });
        return;
      }
      setAttachment(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (values?.feedback?.length < MIN_LENGTH) {
      setError(true);
      enqueueSnackbar({
        variant: 'error',
        message: `Please provide at least ${MIN_LENGTH} characters of feedback.`,
      });
      return;
    }

    setSaving(true);
    try {
      // Upload attachment if one is selected
      let uploadedAttachment = null;
      if (attachment) {
        try {
          const formData = new FormData();
          formData.append('file', attachment);

          const token = safeLocalStorageGet(accessTokenKey);
          if (!token) {
            throw new Error('Authentication required');
          }

          const uploadResponse = await fetch('/api/support/upload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || 'Upload failed');
          }

          const uploadData = await uploadResponse.json();
          uploadedAttachment = {
            fileName: uploadData.fileName,
            fileUrl: uploadData.fileUrl,
            fileType: uploadData.fileType,
            fileSize: uploadData.fileSize,
          };
        } catch (uploadError: any) {
          console.error('Error uploading attachment:', uploadError);
          enqueueSnackbar({
            variant: 'error',
            message: `Failed to upload attachment: ${uploadError.message}`,
          });
          setSaving(false);
          return;
        }
      }

      const ticketData = {
        subject: 'User Feedback',
        description: values.feedback,
        category: 'feedback',
        priority: 'medium',
        contact: {
          firstName: values.firstName || '',
          lastName: values.lastName || '',
          email: values.email || '',
        },
        attachments: uploadedAttachment ? [uploadedAttachment] : [],
      };

      console.log('Submitting feedback to /api/support:', ticketData);
      const response = await axios.post('/api/support', ticketData);
      console.log('Feedback submission response:', response.data);

      enqueueSnackbar({
        message: 'Feedback submitted successfully!',
        variant: 'success',
      });
      setValues(initialValues);
      setAttachment(null);
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      console.error('Error details:', error.response?.data || error.message);
      enqueueSnackbar({
        variant: 'error',
        message: 'Failed to submit feedback. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpen = () => {
    setActive(true);
    setOpenModal(true);
  };

  const handleClose = () => {
    setActive(false);
    setOpenModal(false);
  };

  const handleEditSubmit = async () => {
    if (!ticketId) return;
    setSaving(true);
    try {
      await axios.patch('/api/support', {
        ticketId,
        priority: editValues.priority,
        status: editValues.status,
      });
      enqueueSnackbar({
        message: 'Ticket updated successfully!',
        variant: 'success',
      });
      setEditMode(false);
      if (props.onReload) props.onReload();
    } catch (error: any) {
      enqueueSnackbar({
        variant: 'error',
        message: 'Failed to update ticket.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!ticketId) return;
    setSaving(true);
    try {
      await axios.delete(`/api/support?_id=${ticketId}`);
      enqueueSnackbar({
        message: 'Ticket deleted successfully!',
        variant: 'success',
      });
      setDeleteDialogOpen(false);
      if (props.onReload) props.onReload();
    } catch (error: any) {
      enqueueSnackbar({
        variant: 'error',
        message: 'Failed to delete ticket.',
      });
    } finally {
      setSaving(false);
    }
  };

  // If user is admin, show ticket display component
  if (isAdmin) {
    return (
      <>
        {/* ================= CARD ================= */}
        <Card
          onClick={handleOpen}
          sx={(theme) => ({
            borderRadius: 1,
            border: "1.5px solid",
            borderColor: active
              ? theme.palette.mode === "dark"
                ? "#60A5FA" // light blue (dark bg)
                : "#3B82F6"
              : theme.palette.mode === "dark"
                ? "#2A2F3A"
                : "#ECEDF0",

            backgroundColor: active
              ? theme.palette.mode === "dark"
                ? "#0F1A2A" // dark blue tint
                : "#EFF4FB"
              : theme.palette.mode === "dark"
                ? "#0B0F1A"
                : "#fff",

            cursor: "pointer",
            transition: "all 0.25s ease",
            p: 2,
          })}
        >
          <Box>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box display="flex" gap={2} alignItems="center">
                <Avatar src={avatar} sx={{ width: 44, height: 44, borderRadius: 1 }} />
                <Typography fontWeight={600}>{name}</Typography>
              </Box>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption" color="text.secondary">
                  {time}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchorEl(e.currentTarget);
                  }}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={() => setAnchorEl(null)}
                >
                  <MenuItem onClick={() => { setAnchorEl(null); setEditMode(true); setEditValues({ subject: subject || '', description: message || '', priority: priority?.toLowerCase().replace(' priority', '') || 'medium', status: status?.toLowerCase() || 'open', category: department || 'general' }); }}>
                    <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
                  </MenuItem>
                  <MenuItem onClick={() => { setAnchorEl(null); setDeleteDialogOpen(true); }}>
                    <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
                  </MenuItem>
                </Menu>
              </Box>
            </Box>

            {/* Message */}
            <Typography variant="body2" mt={2} noWrap color="text.secondary">
              {message}
            </Typography>

            {/* Attachment Count */}
            {attachments && attachments.length > 0 && (
              <Box mt={1.5} display="flex" alignItems="center" gap={0.5}>
                <AttachFile sx={{ fontSize: 14, color: 'text.secondary' }} />
                <Typography variant="caption" color="text.secondary">
                  +{attachments.length} attachment{attachments.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}

            {/* Chips */}
            <Box display="flex" gap={1} mt={2} flexWrap="wrap">
              {newticket && <StatusChip label={newticket} bg="rgba(34, 197, 94, 0.2)" color="#22C55E" />}
              {status && <StatusChip label={status} bg="rgba(59, 130, 246, 0.2)" color="#3B82F6" />}
              {priority && <StatusChip label={priority} bg="rgba(255, 0, 0, 0.2)" color="#FF0000" />}
              {mediumpriority && <StatusChip label={mediumpriority} bg="rgba(129, 8, 234, 0.2)" color="#8108EA" />}
              {lowpriority && <StatusChip label={lowpriority} bg="rgba(67, 185, 178, 0.2)" color="#43B9B2" />}
            </Box>
          </Box>
        </Card>

        {/* ================= MODAL ================= */}
        <Dialog
          open={openModal}
          onClose={handleClose}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, p: 3 },
          }}
        >
          {/* Modal Header */}
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography fontWeight={600} fontSize={18}>
              {subject || 'Support Ticket'}
            </Typography>
            <IconButton onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Tags */}
          <Box display="flex" gap={1} mt={2}>
            {newticket && <StatusChip label={newticket} bg="rgba(34, 197, 94, 0.2)" color="#22C55E" />}
            {status && <StatusChip label={status} bg="rgba(59, 130, 246, 0.2)" color="#3B82F6" />}
            {priority && <StatusChip label={priority} bg="rgba(255, 0, 0, 0.2)" color="#FF0000" />}
            {mediumpriority && <StatusChip label={mediumpriority} bg="rgba(129, 8, 234, 0.2)" color="#8108EA" />}
            {lowpriority && <StatusChip label={lowpriority} bg="rgba(67, 185, 178, 0.2)" color="#43B9B2" />}
          </Box>

          {/* User Info */}
          <Box display="flex" alignItems="center" gap={2} mt={3}>
            <Avatar src={avatar} sx={{ width: 44, height: 44, borderRadius: 1 }} />
            <Box>
              <Typography fontWeight={600}>{name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {time}
              </Typography>
            </Box>
          </Box>

          {/* Message */}
          <Typography mt={2} color="text.secondary">
            {message}
          </Typography>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <Box mt={3}>
              <Typography fontWeight={600} mb={1}>
                Attachments
              </Typography>
              <Box display="flex" flexDirection="column" gap={1}>
                {attachments.map((file, index) => (
                  <TextField
                    key={file.fileUrl || `${index}`}
                    value={file.fileName || `Attachment ${index + 1}`}
                    variant="outlined"
                    size="small"
                    fullWidth
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            edge="end"
                            onClick={() => window.open(file.fileUrl, '_blank', 'noopener,noreferrer')}
                            size="small"
                            sx={{ color: 'primary.main' }}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Dialog>

        {/* ================= EDIT MODAL ================= */}
        <Dialog
          open={editMode}
          onClose={() => setEditMode(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 2, p: 3 },
          }}
        >
          <DialogTitle>Edit Support Ticket</DialogTitle>
          <DialogContent>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Subject</Typography>
              <Typography>{editValues.subject}</Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Description</Typography>
              <Typography>{editValues.description}</Typography>
            </Box>
            <FormControl fullWidth margin="dense">
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Priority</Typography>
              <Select
                value={editValues.priority}
                onChange={(e) => setEditValues({ ...editValues, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="dense">
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>Status</Typography>
              <Select
                value={editValues.status}
                onChange={(e) => setEditValues({ ...editValues, status: e.target.value })}
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Category</Typography>
              <Typography>{editValues.category}</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditMode(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} variant="contained">Save</Button>
          </DialogActions>
        </Dialog>

        {/* ================= DELETE DIALOG ================= */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          PaperProps={{
            sx: { borderRadius: 2, p: 3 },
          }}
        >
          <DialogTitle>Delete Support Ticket</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete this support ticket? This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  // If user is not admin, show feedback form
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
                helperText={error ? `Please enter at least ${MIN_LENGTH} characters.` : ''}
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
                  // Accept all file types including PDFs, images, and videos
                  accept="*/*"
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

/* ================= REUSABLE CHIP ================= */
const StatusChip = ({ label, bg, color }) => (
  <Chip
    label={label}
    size="small"
    sx={{
      backgroundColor: bg,
      color,
      borderRadius: "4px",
      px: 1,
      fontSize: "14px",
      minWidth: 'fit-content !important',
      padding: '8px 10px',
      '& .MuiChip-label': { fontSize: '14px', padding: 0, }
    }}
  />
);
