'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
  Paper,
  Chip,
  Divider,
  IconButton,
  useTheme,
  TextField,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { ArrowBack, EditOutlined, SaveOutlined, CancelOutlined, AttachFile, Delete, InfoOutlined } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { Task, TaskAttachment, Subtask } from '../types';
import { Project } from '../../projects/types';
import FileAttachmentDialog from '../components/FileAttachmentDialog';
import SubtasksSection from '../components/SubtasksSection';
import RichTextEditor from '../components/RichTextEditor';
import PrioritySelect from '../components/PrioritySelect';
import StatusSelect from '../components/StatusSelect';
import { getPriorityColor as getPriorityColorUtil, getPriorityDisplayName } from '../utils/priorityColors';
import { getStatusColor, getStatusDisplayName } from '../utils/statusColors';

const ActionBar = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
}));

interface ApiTask {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  projectId?: string;
  dueDate?: string;
  attachments?: TaskAttachment[];
  subtasks?: Subtask[];
}

const TaskDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const theme = useTheme();
  const taskId = params?.id as string;
  const projectId = params?.projectId as string;

  // Redirect to projects page if accessed directly (tasks must be accessed through projects)
  useEffect(() => {
    router.replace('/dashboard/projects');
  }, [router]);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [task, setTask] = useState<Task | null>(null);
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState<boolean>(false);
  const [dueDateError, setDueDateError] = useState<string>('');
  const [dueDateErrorTimeout, setDueDateErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPastDate, setIsPastDate] = useState<boolean>(false);

  useEffect(() => {
    if (taskId) {
      fetchTaskData();
      fetchProjects();
    }
  }, [taskId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dueDateErrorTimeout) {
        clearTimeout(dueDateErrorTimeout);
      }
    };
  }, [dueDateErrorTimeout]);

  const fetchProjects = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/projects?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Convert projects to match the format expected by the dropdown
        const convertedProjects: Project[] = (response.data.projects || []).map((p: any) => ({
          id: typeof p._id === 'string' ? p._id : (p._id?.toString() || ''),
          name: p.name || '',
          description: p.description || '',
          status: p.status || '',
          dueDate: p.dueDate || '',
        }));
        setProjects(convertedProjects);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTaskData = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch all projects and their tasks to find the task
      const projectsResponse = await axios.get('/api/projects?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (projectsResponse.data.success) {
        const allProjects = projectsResponse.data.projects || [];
        let foundTask: ApiTask | null = null;
        let foundProject: Project | null = null;

        // Search through all projects to find the task
        for (const proj of allProjects) {
          try {
            const tasksResponse = await axios.get(`/api/projects/${proj._id}/tasks?limit=1000`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (tasksResponse.data.success && tasksResponse.data.tasks) {
              const task = tasksResponse.data.tasks.find(
                (t: ApiTask) => String(t._id) === String(taskId)
              );
              if (task) {
                foundTask = task;
                foundProject = {
                  id: typeof proj._id === 'string' ? proj._id : (proj._id?.toString() || ''),
                  name: proj.name || '',
                  description: proj.description || '',
                  status: proj.status || '',
                  dueDate: proj.dueDate || '',
                };
                break;
              }
            }
          } catch (error) {
            console.error(`Error fetching tasks for project ${proj._id}:`, error);
          }
        }

        if (foundTask && foundProject) {
          // Format dueDate if it exists
          let formattedDueDate = '';
          if (foundTask.dueDate) {
            try {
              const date = new Date(foundTask.dueDate);
              if (!isNaN(date.getTime())) {
                // Format as YYYY-MM-DD for date input
                formattedDueDate = date.toISOString().split('T')[0];
              }
            } catch (e) {
              // If it's already in YYYY-MM-DD format, use it as is
              formattedDueDate = foundTask.dueDate;
            }
          }
          
          // Ensure projectId is in string format
          const taskProjectId = foundTask.projectId 
            ? (typeof foundTask.projectId === 'string' ? foundTask.projectId : String(foundTask.projectId))
            : (foundProject?.id ? String(foundProject.id) : '');
          
          const convertedTask: Task = {
            id: typeof foundTask._id === 'string' ? foundTask._id : String(foundTask._id || ''),
            title: foundTask.title,
            description: foundTask.description || '',
            status: foundTask.status === 'pending' ? 'Todo' : foundTask.status === 'in-progress' ? 'In Progress' : foundTask.status === 'completed' ? 'Done' : foundTask.status,
            priority: foundTask.priority || 'Medium',
            projectId: taskProjectId,
            dueDate: formattedDueDate,
            attachments: foundTask.attachments || [],
            subtasks: foundTask.subtasks || [],
          };
          setTask(convertedTask);
          setEditedTask(convertedTask);
          
          // Ensure foundProject has the correct ID format
          const formattedProject: Project = {
            ...foundProject,
            id: typeof foundProject.id === 'string' ? foundProject.id : (foundProject.id?.toString() || ''),
          };
          setProject(formattedProject);
        } else {
          enqueueSnackbar({ message: 'Task not found', variant: 'error' });
          router.push('/dashboard/projects');
        }
      }
    } catch (error: any) {
      console.error('Error fetching task:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch task',
        variant: 'error',
      });
      router.push('/dashboard/projects');
    } finally {
      setLoading(false);
    }
  };

  // Use centralized priority color utility
  const getPriorityColor = getPriorityColorUtil;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      // Handle both ISO string and date-only formats
      let date: Date;
      if (dateString.includes('T')) {
        date = new Date(dateString);
      } else {
        // If it's just a date string (YYYY-MM-DD), parse it properly
        date = new Date(dateString + 'T00:00:00');
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateString || 'Not set';
    }
  };

  // Check if due date is today
  const isDueToday = (dueDate?: string): boolean => {
    if (!dueDate) return false;
    try {
      const today = new Date();
      let date: Date;
      if (dueDate.includes('T')) {
        date = new Date(dueDate);
      } else {
        date = new Date(dueDate + 'T00:00:00');
      }
      
      if (isNaN(date.getTime())) return false;
      
      // Normalize both dates to start of day for accurate comparison
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      
      return (
        today.getFullYear() === date.getFullYear() &&
        today.getMonth() === date.getMonth() &&
        today.getDate() === date.getDate()
      );
    } catch {
      return false;
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTask(task);
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setEditedTask((prevTask) => (prevTask ? { ...prevTask, [name as string]: value } : null));
  };

  const handleSave = async () => {
    if (!editedTask || !task) return;

    // Prevent saving if past date is selected
    if (isPastDate) {
      enqueueSnackbar({ 
        message: 'Please select a future date for the due date', 
        variant: 'error' 
      });
      return;
    }

    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      if (!editedTask.projectId) {
        enqueueSnackbar({ message: 'Project ID is required', variant: 'error' });
        setSaving(false);
        return;
      }

      // Convert status to API format
      const apiStatus = editedTask.status === 'Todo' ? 'pending' : editedTask.status === 'In Progress' ? 'in-progress' : editedTask.status === 'Done' ? 'completed' : editedTask.status;

      // Ensure dueDate is properly formatted (YYYY-MM-DD) or undefined if empty
      let formattedDueDate: string | undefined = undefined;
      if (editedTask.dueDate && editedTask.dueDate.trim() !== '') {
        // If it's already in YYYY-MM-DD format, use it
        if (editedTask.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          formattedDueDate = editedTask.dueDate;
        } else {
          // Try to parse and format
          try {
            const date = new Date(editedTask.dueDate);
            if (!isNaN(date.getTime())) {
              formattedDueDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            // If parsing fails, set to undefined
            formattedDueDate = undefined;
          }
        }
      }

      await axios.patch(
        `/api/projects/${editedTask.projectId}/tasks`,
        {
          taskId: editedTask.id,
          title: editedTask.title,
          description: editedTask.description,
          status: apiStatus,
          priority: editedTask.priority,
          dueDate: formattedDueDate,
          attachments: editedTask.attachments || [],
          subtasks: editedTask.subtasks || [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      enqueueSnackbar({ message: 'Task updated successfully', variant: 'success' });
      
      // Update task state with edited data
      const updatedTask = { ...editedTask };
      setTask(updatedTask);
      setIsEditing(false);
      
      // Update project if changed
      if (editedTask.projectId !== task.projectId) {
        const newProject = projects.find((p) => String(p.id) === String(editedTask.projectId));
        if (newProject) {
          setProject(newProject);
        } else if (!editedTask.projectId) {
          setProject(null);
        }
      }
      
      // Refresh task data from server to ensure consistency
      fetchTaskData();
    } catch (error: any) {
      console.error('Error updating task:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to update task',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!task) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Task not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <ActionBar>
        <Stack direction="row" spacing={2} alignItems="center">
          <IconButton onClick={() => router.push('/dashboard/projects')} size="small">
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Task Details
          </Typography>
        </Stack>
        {isEditing ? (
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<CancelOutlined />}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveOutlined />}
              onClick={handleSave}
              disabled={saving || isPastDate}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Stack>
        ) : (
          <Button
            variant="contained"
            startIcon={<EditOutlined />}
            onClick={handleEdit}
          >
            Edit Task
          </Button>
        )}
      </ActionBar>

      <Paper
        sx={{
          p: 4,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Stack spacing={4}>
          {/* Title */}
          <Box>
            {isEditing ? (
              <TextField
                name="title"
                label="Title"
                value={editedTask?.title || ''}
                onChange={handleChange}
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
              />
            ) : (
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 2,
                }}
              >
                {task.title}
              </Typography>
            )}
          </Box>

          <Divider />

          {/* Status and Priority */}
          <Stack direction="row" spacing={3} flexWrap="wrap" sx={{ gap: 2 }}>
            <Box sx={{ minWidth: 200 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 1,
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  letterSpacing: '0.5px',
                }}
              >
                Status
              </Typography>
              {isEditing ? (
                <TextField
                  select
                  name="status"
                  value={editedTask?.status || ''}
                  onChange={handleChange}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="Todo">Todo</MenuItem>
                  <MenuItem value="In Progress">In Progress</MenuItem>
                  <MenuItem value="Done">Done</MenuItem>
                </TextField>
              ) : (
                <Chip
                  label={task.status || 'Not set'}
                  size="medium"
                  sx={{
                    height: '28px',
                    fontSize: '13px',
                    fontWeight: 500,
                    bgcolor: getStatusColor(task.status || 'Todo', task.projectId).bg,
                    color: getStatusColor(task.status || 'Todo', task.projectId).text,
                    border: 'none',
                  }}
                />
              )}
            </Box>
            <Box sx={{ minWidth: 200 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 1,
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  letterSpacing: '0.5px',
                }}
              >
                Priority
              </Typography>
              {isEditing ? (
                <PrioritySelect
                  value={editedTask?.priority || 'Medium'}
                  onChange={(value) => {
                    setEditedTask((prevTask) => (prevTask ? { ...prevTask, priority: value } : null));
                  }}
                  fullWidth
                  size="small"
                />
              ) : (
                <Chip
                  label={getPriorityDisplayName(task.priority || 'Medium', task.projectId)}
                  size="medium"
                  sx={{
                    height: '28px',
                    fontSize: '13px',
                    fontWeight: 500,
                    bgcolor: getPriorityColorUtil(task.priority || '').bg,
                    color: getPriorityColorUtil(task.priority || '').text,
                    border: 'none',
                  }}
                />
              )}
            </Box>
          </Stack>

          <Divider />

          {/* Description */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 2,
                color: theme.palette.text.secondary,
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '11px',
                letterSpacing: '0.5px',
              }}
            >
              Description
            </Typography>
            {isEditing ? (
              <RichTextEditor
                value={editedTask?.description || ''}
                onChange={(value) => {
                  setEditedTask((prev) => (prev ? { ...prev, description: value } : null));
                }}
                placeholder="Type / for menu"
                onAddAttachment={handleAddAttachment}
              />
            ) : (
              <Box
                sx={{
                  color: theme.palette.text.primary,
                  '& p': {
                    margin: 0,
                    marginBottom: '12px',
                    lineHeight: 1.6,
                  },
                  '& ul, & ol': {
                    marginLeft: '24px',
                    marginBottom: '12px',
                    paddingLeft: '8px',
                    '& li': {
                      marginBottom: '4px',
                    },
                  },
                  '& h1': {
                    fontSize: '2em',
                    fontWeight: 600,
                    marginTop: '16px',
                    marginBottom: '12px',
                  },
                  '& h2': {
                    fontSize: '1.5em',
                    fontWeight: 600,
                    marginTop: '16px',
                    marginBottom: '12px',
                  },
                  '& h3': {
                    fontSize: '1.17em',
                    fontWeight: 600,
                    marginTop: '16px',
                    marginBottom: '12px',
                  },
                  '& a': {
                    color: theme.palette.primary.main,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  },
                  '& .mention': {
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.3)' : '#e3f2fd',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    display: 'inline-block',
                  },
                  '& blockquote': {
                    borderLeft: `4px solid ${theme.palette.divider}`,
                    paddingLeft: '16px',
                    marginLeft: 0,
                    marginRight: 0,
                    fontStyle: 'italic',
                    color: theme.palette.text.secondary,
                  },
                  '& code': {
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.9em',
                  },
                  '& pre': {
                    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
                    padding: '12px',
                    borderRadius: '4px',
                    overflow: 'auto',
                    '& code': {
                      backgroundColor: 'transparent',
                      padding: 0,
                    },
                  },
                }}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: task.description || '<p>No description provided</p>',
                  }}
                />
              </Box>
            )}
          </Box>

          <Divider />
          {/* Due Date */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  letterSpacing: '0.5px',
                }}
              >
                Due Date
              </Typography>
              <Tooltip
                title="Tasks with due dates set to today will have a red background until they are marked as completed."
                arrow
              >
                <IconButton
                  size="small"
                  sx={{
                    p: 0,
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <InfoOutlined sx={{ fontSize: '14px' }} />
                </IconButton>
              </Tooltip>
            </Stack>
            {isEditing ? (
              <TextField
                name="dueDate"
                label="Due Date"
                type="date"
                value={editedTask?.dueDate ? editedTask.dueDate.split('T')[0] : ''}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  
                  // ALWAYS update the form state first to prevent date/month from disappearing
                  setEditedTask((prev) => (prev ? { ...prev, dueDate: dateValue } : null));
                  
                  // Clear any existing timeout
                  if (dueDateErrorTimeout) {
                    clearTimeout(dueDateErrorTimeout);
                    setDueDateErrorTimeout(null);
                  }

                  // Only validate if date is complete (YYYY-MM-DD format = 10 characters)
                  if (dateValue && dateValue.length === 10) {
                    // Validate date format
                    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                    if (!dateRegex.test(dateValue)) {
                      setDueDateError('Invalid date format. Please enter a valid date.');
                      setIsPastDate(false);
                      const timeout = setTimeout(() => setDueDateError(''), 2000);
                      setDueDateErrorTimeout(timeout);
                      return;
                    }

                    const [year, month, day] = dateValue.split('-').map(Number);
                    const date = new Date(year, month - 1, day);
                    
                    // Check if date is valid (handles invalid dates like Feb 30)
                    if (!(date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day)) {
                      setDueDateError('Invalid date format. Please enter a valid date.');
                      setIsPastDate(false);
                      const timeout = setTimeout(() => setDueDateError(''), 2000);
                      setDueDateErrorTimeout(timeout);
                      return;
                    }

                    // Validate due date - must be a future date using normalized Date objects
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
                }}
                fullWidth
                size="small"
                error={!!dueDateError}
                helperText={dueDateError || ''}
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
                inputProps={{
                    min: new Date().toISOString().split('T')[0], // Set minimum date to today
                }}
              />
            ) : (
              <Typography
                variant="body1"
                sx={{
                  color: isDueToday(task.dueDate)
                    ? theme.palette.mode === 'dark'
                      ? '#f87171' // Lighter red for dark mode
                      : '#ef4444' // Red for light mode
                    : theme.palette.text.primary,
                  fontWeight: isDueToday(task.dueDate) ? 600 : 400,
                }}
              >
                {formatDate(task.dueDate)}
              </Typography>
            )}
          </Box>

          {/* Project */}
          <Divider />
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: theme.palette.text.secondary,
                fontWeight: 600,
                textTransform: 'uppercase',
                fontSize: '11px',
                letterSpacing: '0.5px',
              }}
            >
              Project
            </Typography>
            {isEditing ? (
              <TextField
                select
                name="projectId"
                value={editedTask?.projectId ? String(editedTask.projectId) : ''}
                onChange={handleChange}
                fullWidth
                size="small"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {projects.map((proj) => (
                  <MenuItem key={String(proj.id)} value={String(proj.id)}>
                    {proj.name || 'Unnamed Project'}
                  </MenuItem>
                ))}
              </TextField>
            ) : (
              <Typography
                variant="body1"
                sx={{
                  color: theme.palette.text.primary,
                }}
              >
                {project?.name || (task.projectId ? 'Project not found' : 'Not assigned')}
              </Typography>
            )}
          </Box>

          {/* Attachments */}
          <Divider />
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: theme.palette.text.secondary,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontSize: '11px',
                  letterSpacing: '0.5px',
                }}
              >
                Attachments ({(isEditing ? editedTask?.attachments : task.attachments)?.length || 0})
              </Typography>
              {isEditing && (
                <Button
                  startIcon={<AttachFile />}
                  onClick={() => setAttachmentDialogOpen(true)}
                  size="small"
                  variant="outlined"
                >
                  Attach
                </Button>
              )}
            </Stack>
            {((isEditing ? editedTask?.attachments : task.attachments) || []).length > 0 ? (
              <Stack spacing={1}>
                {(isEditing ? editedTask?.attachments : task.attachments)?.map((attachment, index) => (
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
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          color: theme.palette.text.primary,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 500,
                        }}
                      >
                        {attachment.fileName}
                      </Typography>
                      {attachment.fileSize && attachment.attachmentType === 'file' && (
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {(attachment.fileSize / 1024 / 1024).toFixed(2)} MB
                        </Typography>
                      )}
                      {attachment.attachmentType !== 'file' && (
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {attachment.attachmentType === 'url' ? 'URL Link' : 
                           attachment.attachmentType === 'google_drive' ? 'Google Drive' :
                           attachment.attachmentType === 'onedrive' ? 'OneDrive/SharePoint' : 'Link'}
                        </Typography>
                      )}
                    </Box>
                    <Button
                      size="small"
                      href={attachment.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View
                    </Button>
                    {isEditing && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteAttachment(index)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                No attachments
              </Typography>
            )}
          </Box>

          {/* Subtasks */}
          <Divider />
          <SubtasksSection
            subtasks={isEditing ? (editedTask?.subtasks || []) : (task.subtasks || [])}
            onAddSubtask={handleAddSubtask}
            onUpdateSubtask={handleUpdateSubtask}
            onDeleteSubtask={handleDeleteSubtask}
            canEdit={isEditing}
          />
        </Stack>
      </Paper>

      <FileAttachmentDialog
        open={attachmentDialogOpen}
        onClose={() => setAttachmentDialogOpen(false)}
        onAddAttachment={handleAddAttachment}
      />
    </Box>
  );
};

export default TaskDetailsPage;

