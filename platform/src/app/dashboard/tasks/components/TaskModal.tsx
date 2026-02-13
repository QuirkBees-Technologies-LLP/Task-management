'use client';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  MenuItem,
  TextField,
  Box,
  Divider,
  Stack,
  Typography,
  IconButton,
  useTheme,
  CircularProgress,
  Menu,
  Tooltip,
  Autocomplete,
  Avatar,
  Chip,
} from '@mui/material';
import {
  AttachFile,
  Delete,
  CheckCircle,
  ThumbUp,
  ThumbUpOutlined,
  OpenInFull,
  MoreVert,
  ArrowForward,
  Visibility,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { Task, TaskDialogProps, TaskAttachment, Subtask } from '../types';
import FileAttachmentDialog from './FileAttachmentDialog';
import SubtasksSection from './SubtasksSection';
import RichTextEditor from './RichTextEditor';
import PrioritySelect from './PrioritySelect';
import StatusSelect from './StatusSelect';
import { getStatusOptions } from '../utils/statusColors';
import { jwtDecode } from 'jwt-decode';

function TaskDialog({ open, onClose, onSave, task, projects, saving = false, restrictProjectId }: TaskDialogProps) {
  const theme = useTheme();
  const router = useRouter();
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState<boolean>(false);
  const [dueDateError, setDueDateError] = useState<string>('');
  const [dueDateErrorTimeout, setDueDateErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPastDate, setIsPastDate] = useState<boolean>(false);
  const [liked, setLiked] = useState<boolean>(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [previousStatus, setPreviousStatus] = useState<string>('');
  const [users, setUsers] = useState<Array<{ _id: string; firstName: string; lastName: string; email: string }>>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);

  useEffect(() => {
    if (task) {
      // Ensure status is always defined and normalized
      const statusOptions = getStatusOptions(task.projectId);
      const defaultStatus = statusOptions.length > 0 ? statusOptions[0].value : 'Todo';
      let taskStatus = task.status || defaultStatus;

      // Normalize status from API format to frontend format if needed
      const statusLower = (taskStatus || '').toLowerCase();

      // Check if task is completed BEFORE normalization to preserve completion state
      const isCompletedFromStatus = statusLower.includes('done') || statusLower.includes('completed');

      if (statusLower === 'pending') {
        taskStatus = 'Todo';
      } else if (statusLower === 'in-progress') {
        taskStatus = 'In Progress';
      } else if (statusLower === 'completed') {
        // Find the "Done" or "Completed" status from options
        const completedStatus = statusOptions.find(
          (opt) => opt.value.toLowerCase().includes('done') || opt.value.toLowerCase().includes('completed')
        );
        taskStatus = completedStatus ? completedStatus.value : 'Done';
      } else if (isCompletedFromStatus && statusLower !== 'done') {
        // Handle case where status contains 'done' but isn't exactly 'done'
        // Find the "Done" or "Completed" status from options
        const completedStatus = statusOptions.find(
          (opt) => opt.value.toLowerCase().includes('done') || opt.value.toLowerCase().includes('completed')
        );
        taskStatus = completedStatus ? completedStatus.value : taskStatus;
      }
      // If it's already in frontend format or custom status, use as is

      // Format dueDate to YYYY-MM-DD for HTML date input
      let formattedDueDate = '';
      if (task.dueDate) {
        try {
          // Check if it's already in YYYY-MM-DD format
          if (typeof task.dueDate === 'string' && task.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDueDate = task.dueDate;
          } else {
            // Try to parse as Date and format
            const date = new Date(task.dueDate);
            if (!isNaN(date.getTime())) {
              formattedDueDate = date.toISOString().split('T')[0];
            }
          }
        } catch (e) {
          // If parsing fails, leave as empty string
          formattedDueDate = '';
        }
      }

      setEditedTask({
        ...task,
        status: taskStatus,
        dueDate: formattedDueDate,
        attachments: task.attachments || [],
        subtasks: task.subtasks || [],
        assignee: task.assignee || [], // Initialize assignee array
        projectId: restrictProjectId || task.projectId, // Use restricted project if provided
      });

      // Store previous status correctly based on current completion state
      const currentStatusLower = (taskStatus || '').toLowerCase();
      const isCurrentlyCompleted = currentStatusLower.includes('done') || currentStatusLower.includes('completed');

      if (!isCurrentlyCompleted) {
        // Store current status as previous if not completed
        setPreviousStatus(taskStatus);
      } else {
        // If already completed, store a sensible default previous status
        // Try to find a non-completed status from options (prefer 'In Progress' or first non-completed)
        const nonCompletedStatus = statusOptions.find(
          (opt) => !opt.value.toLowerCase().includes('done') && !opt.value.toLowerCase().includes('completed')
        );
        setPreviousStatus(nonCompletedStatus ? nonCompletedStatus.value : defaultStatus);
      }

      // Load liked state from localStorage
      const likedTasks = JSON.parse(localStorage.getItem('likedTasks') || '[]');
      setLiked(likedTasks.includes(String(task.id)));
    } else {
      const statusOptions = getStatusOptions();
      const defaultStatus = statusOptions.length > 0 ? statusOptions[0].value : 'Todo';
      setEditedTask({
        id: '',
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'Medium',
        projectId: restrictProjectId || '', // Use restricted project if provided
        dueDate: '',
        attachments: [],
        subtasks: [],
        assignee: [], // Initialize empty assignee array
      });
      setPreviousStatus(defaultStatus);
      setLiked(false);
    }
  }, [task, restrictProjectId]);

  // Fetch users for assignee dropdown
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
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (open) {
      fetchUsers();
    }
  }, [open]);

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;

    // Prevent changing projectId when restricted
    if (name === 'projectId' && restrictProjectId) {
      return;
    }

    // Validate due date - must be a future date
    if (name === 'dueDate') {
      const dateValue = value as string;

      // ALWAYS update the form state first to prevent date/month from disappearing
      setEditedTask((prevTask) => (prevTask ? { ...prevTask, [name as string]: dateValue } : null));

      // Clear any existing timeout
      if (dueDateErrorTimeout) {
        clearTimeout(dueDateErrorTimeout);
        setDueDateErrorTimeout(null);
      }

      // Only validate if date is complete (YYYY-MM-DD format = 10 characters)
      if (dateValue && dateValue.length === 10) {
        // First validate date format
        if (!isValidDateFormat(dateValue)) {
          setDueDateError('Invalid date format. Please enter a valid date.');
          setIsPastDate(false);
          const timeout = setTimeout(() => setDueDateError(''), 2000);
          setDueDateErrorTimeout(timeout);
          return;
        }

        // Validate due date - must be a future date using normalized Date objects
        const [year, month, day] = dateValue.split('-').map(Number);
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
      } else if (dateValue && dateValue.length < 10) {
        // Date is incomplete, don't validate yet, just clear errors
        setDueDateError('');
        setIsPastDate(false);
      } else {
        // Empty value
        setDueDateError('');
        setIsPastDate(false);
      }
    } else {
      setEditedTask((prevTask) => (prevTask ? { ...prevTask, [name as string]: value } : null));
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

  const handleSave = () => {
    if (saving) return;
    if (editedTask && !isPastDate) {
      onSave(editedTask);
    }
  };

  const handleMarkComplete = async () => {
    if (!editedTask || saving) return;

    // Determine current completion state from status - single source of truth
    const currentStatus = (editedTask.status || '').toLowerCase();
    const isCurrentlyCompleted = currentStatus.includes('done') || currentStatus.includes('completed');

    let updatedTask: Task;
    const statusOptions = getStatusOptions(editedTask.projectId);

    if (isCurrentlyCompleted) {
      // Toggle: Mark as incomplete - revert to previous status
      const revertStatus = previousStatus || (statusOptions.length > 0 ? statusOptions[0].value : 'Todo');
      updatedTask = {
        ...editedTask,
        status: revertStatus,
      };
      // Update previous status to current completed status for potential re-completion
      setPreviousStatus(editedTask.status);
    } else {
      // Toggle: Mark as completed
      // Store current status as previous status before marking complete
      setPreviousStatus(editedTask.status);

      // Find "Done" or "Completed" status from options
      let completedStatusValue = statusOptions.length > 0 ? statusOptions[statusOptions.length - 1].value : 'Done';

      // Try to find a status that contains "done" or "completed"
      const foundStatus = statusOptions.find(
        (opt) => opt.value.toLowerCase().includes('done') || opt.value.toLowerCase().includes('completed')
      );
      if (foundStatus) {
        completedStatusValue = foundStatus.value;
      }

      updatedTask = {
        ...editedTask,
        status: completedStatusValue,
      };
    }

    // Update local state immediately for instant UI feedback (icon + button text update)
    setEditedTask(updatedTask);

    // Persist the updated completed state via API without closing the editor
    onSave(updatedTask, true);
  };

  const handleLike = () => {
    if (!editedTask) return;
    const newLiked = !liked;
    setLiked(newLiked);

    // Save to localStorage
    const likedTasks = JSON.parse(localStorage.getItem('likedTasks') || '[]');
    const taskId = String(editedTask.id);

    if (newLiked) {
      if (!likedTasks.includes(taskId)) {
        likedTasks.push(taskId);
      }
    } else {
      const index = likedTasks.indexOf(taskId);
      if (index > -1) {
        likedTasks.splice(index, 1);
      }
    }

    localStorage.setItem('likedTasks', JSON.stringify(likedTasks));
  };

  const handleExpand = () => {
    if (!editedTask || !editedTask.id) return;
    router.push(`/dashboard/tasks/${editedTask.id}`);
    onClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleAddAttachment = (attachment: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    attachmentType: 'file' | 'url' | 'google_drive' | 'onedrive' | 'box' | 'dropbox';
  }) => {
    if (editedTask) {
      const newAttachment: TaskAttachment = {
        fileName: attachment.fileName,
        fileUrl: attachment.fileUrl,
        fileType: attachment.fileType,
        fileSize: attachment.fileSize,
        attachmentType: attachment.attachmentType,
        uploadedAt: new Date().toISOString(),
      };
      setEditedTask({
        ...editedTask,
        attachments: [...(editedTask.attachments || []), newAttachment],
      });
    }
  };

  const handleDeleteAttachment = (index: number) => {
    if (editedTask && editedTask.attachments) {
      const updatedAttachments = editedTask.attachments.filter((_, i) => i !== index);
      setEditedTask({
        ...editedTask,
        attachments: updatedAttachments,
      });
    }
  };

  const handleAddSubtask = (subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editedTask) {
      const newSubtask: Subtask = {
        ...subtask,
        id: `subtask-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setEditedTask({
        ...editedTask,
        subtasks: [...(editedTask.subtasks || []), newSubtask],
      });
    }
  };

  const handleUpdateSubtask = (id: string, updates: Partial<Subtask>) => {
    if (editedTask && editedTask.subtasks) {
      const updatedSubtasks = editedTask.subtasks.map((subtask) =>
        subtask.id === id
          ? { ...subtask, ...updates, updatedAt: new Date().toISOString() }
          : subtask
      );
      setEditedTask({
        ...editedTask,
        subtasks: updatedSubtasks,
      });
    }
  };

  const handleDeleteSubtask = (id: string) => {
    if (editedTask && editedTask.subtasks) {
      const updatedSubtasks = editedTask.subtasks.filter((subtask) => subtask.id !== id);
      setEditedTask({
        ...editedTask,
        subtasks: updatedSubtasks,
      });
    }
  };

  if (!editedTask) return null;

  // Derive completed state from task status - single source of truth
  const taskStatus = editedTask.status || '';
  const taskStatusLower = taskStatus.toLowerCase();
  const isCompleted = taskStatusLower.includes('done') || taskStatusLower.includes('completed');

  const statusOptions = getStatusOptions(editedTask.projectId);
  const completedStatus = statusOptions.find(
    (opt) => opt.value.toLowerCase().includes('done') || opt.value.toLowerCase().includes('completed')
  )?.value;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      {/* Custom Header Bar */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          {isCompleted ? (
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={handleMarkComplete}
              size="small"
              disabled={saving}
              sx={{
                borderColor: '#10b981',
                backgroundColor: '#d1fae5',
                color: '#059669',
                fontWeight: 500,
                '&:hover': {
                  borderColor: '#059669',
                  backgroundColor: '#a7f3d0',
                },
              }}
            >
              Completed
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={handleMarkComplete}
              size="small"
              disabled={saving}
              sx={{
                borderColor: theme.palette.divider,
                color: theme.palette.text.secondary,
                fontWeight: 400,
                textTransform: 'none',
                '&:hover': {
                  borderColor: theme.palette.text.secondary,
                  backgroundColor: theme.palette.action.hover,
                },
              }}
            >
              Mark complete
            </Button>
          )}
        </Stack>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Tooltip title={liked ? 'Unlike' : 'Like'}>
            <IconButton
              size="small"
              onClick={handleLike}
              color={liked ? 'primary' : 'default'}
            >
              {liked ? <ThumbUp fontSize="small" /> : <ThumbUpOutlined fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Tooltip title="View in full page">
            <IconButton
              size="small"
              onClick={handleExpand}
              disabled={!editedTask.id}
            >
              <OpenInFull fontSize="small" />
            </IconButton>
          </Tooltip>

          <Tooltip title="More options">
            <IconButton
              size="small"
              onClick={handleMenuOpen}
            >
              <MoreVert fontSize="small" />
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <IconButton
            size="small"
            onClick={onClose}
          >
            <ArrowForward fontSize="small" />
          </IconButton>
        </Stack>
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          setAttachmentDialogOpen(true);
        }}>
          <AttachFile fontSize="small" sx={{ mr: 1 }} />
          Attach File
        </MenuItem>
        {editedTask.id && (
          <MenuItem onClick={() => {
            handleMenuClose();
            handleExpand();
          }}>
            <OpenInFull fontSize="small" sx={{ mr: 1 }} />
            View Full Page
          </MenuItem>
        )}
      </Menu>

      <DialogContent dividers>
        <TextField
          autoFocus
          margin="dense"
          name="title"
          label="Title"
          type="text"
          fullWidth
          value={editedTask.title}
          onChange={handleChange}
        />
        <Box sx={{ mt: 1.5, mb: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.75, fontWeight: 600, fontSize: '13px' }}>
            Description
          </Typography>
          <RichTextEditor
            value={editedTask.description || ''}
            onChange={(value) => {
              setEditedTask((prevTask) => (prevTask ? { ...prevTask, description: value } : null));
            }}
            placeholder="Type / for menu"
          />
        </Box>
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <StatusSelect
            value={editedTask.status}
            onChange={(value) => {
              setEditedTask((prevTask) => (prevTask ? { ...prevTask, status: value } : null));
            }}
            fullWidth
            margin="dense"
            projectId={editedTask.projectId}
          />
          <PrioritySelect
            value={editedTask.priority}
            onChange={(value) => {
              setEditedTask((prevTask) => (prevTask ? { ...prevTask, priority: value } : null));
            }}
            fullWidth
            margin="dense"
            projectId={editedTask.projectId}
          />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <TextField
            select
            margin="dense"
            name="projectId"
            label="Project"
            fullWidth
            value={String(editedTask.projectId || '')}
            onChange={handleChange}
            disabled={!!restrictProjectId}
          >
            {(restrictProjectId
              ? projects.filter((project) => String(project.id) === String(restrictProjectId))
              : projects
            ).map((project) => (
              <MenuItem key={project.id} value={String(project.id || '')}>
                {project.name || 'Unnamed Project'}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            margin="dense"
            name="dueDate"
            label="Due Date"
            type="date"
            fullWidth
            value={editedTask.dueDate}
            onChange={handleChange}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
            inputProps={{
              min: new Date().toISOString().split('T')[0], // Set minimum date to today
            }}
            error={!!dueDateError}
            helperText={dueDateError || ''}
          />
        </Stack>
        <Box sx={{ mt: 1 }}>
          <Autocomplete
            multiple
            options={users}
            getOptionLabel={(option) => `${option.firstName} ${option.lastName}`.trim() || option.email}
            isOptionEqualToValue={(option, value) => option._id === value._id}
            value={users.filter((user) => editedTask.assignee?.includes(user._id))}
            onChange={(event, newValue) => {
              const assigneeIds = newValue.map((user) => user._id);
              setEditedTask((prevTask) => (prevTask ? { ...prevTask, assignee: assigneeIds } : null));
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
                      {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} key={option._id}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: '12px' }}>
                    {option.firstName?.[0] || ''}
                    {option.lastName?.[0] || ''}
                  </Avatar>
                  <Stack>
                    <Typography variant="body2">
                      {`${option.firstName} ${option.lastName}`.trim() || option.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option._id}
                  avatar={
                    <Avatar sx={{ width: 24, height: 24, fontSize: '10px' }}>
                      {option.firstName?.[0] || ''}
                      {option.lastName?.[0] || ''}
                    </Avatar>
                  }
                  label={`${option.firstName} ${option.lastName}`.trim() || option.email}
                  size="small"
                />
              ))
            }
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Attachments */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Attachments ({editedTask.attachments?.length || 0})
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
          {editedTask.attachments && editedTask.attachments.length > 0 ? (
            <Stack spacing={0.5}>
              {editedTask.attachments.map((attachment, index) => (
                <Stack
                  key={index}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    bgcolor: theme.palette.action.hover,
                  }}
                >
                  <AttachFile fontSize="small" sx={{ color: theme.palette.text.secondary }} />
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
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
              No attachments
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Subtasks */}
        <SubtasksSection
          subtasks={editedTask.subtasks || []}
          onAddSubtask={handleAddSubtask}
          onUpdateSubtask={handleUpdateSubtask}
          onDeleteSubtask={handleDeleteSubtask}
          canEdit={true}
          projectId={editedTask.projectId}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={saving || isPastDate}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>

      <FileAttachmentDialog
        open={attachmentDialogOpen}
        onClose={() => setAttachmentDialogOpen(false)}
        onAddAttachment={handleAddAttachment}
      />
    </Dialog>
  );
}

export default TaskDialog;
