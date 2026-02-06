'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Avatar,
  Stack,
  useTheme,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  DeleteOutline,
  EditOutlined,
  KeyboardArrowDown,
  KeyboardArrowRight,
  CheckCircle,
  CheckCircleOutline,
  InfoOutlined,
} from '@mui/icons-material';
import { Task } from '../types';
import { getStatusColor, getStatusDisplayName, getStatusOptions } from '../utils/statusColors';
import { getPriorityColor, getPriorityDisplayName } from '../utils/priorityColors';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';
import { getSectionBackgroundColor } from '../utils/sectionColors';

interface TaskSection {
  _id: string;
  name: string;
  order: number;
  isDefault: boolean;
  projectId: string;
  tasks: Array<{
    _id: string;
    title: string;
    description: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    assignee?: string[] | any;
    assigneeInfo?: Array<{
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    }>;
    attachments?: any[];
    subtasks?: any[];
  }>;
}

interface TaskListViewProps {
  projectId: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string | number) => void;
  refreshBoard?: () => void;
}

const TaskListView: React.FC<TaskListViewProps> = ({
  projectId,
  onEditTask,
  onDeleteTask,
  refreshBoard,
}) => {
  const theme = useTheme();
  const [sections, setSections] = useState<TaskSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const open = Boolean(anchorEl);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    taskId: string
  ) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedTaskId(taskId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedTaskId(null);
  };
  // Load collapsed state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`collapsedSections_${projectId}`);
      if (saved) {
        const collapsed = JSON.parse(saved);
        setCollapsedSections(new Set(collapsed));
      }
    } catch (error) {
      console.error('Error loading collapsed sections:', error);
    }
  }, [projectId]);

  // Save collapsed state to localStorage
  const saveCollapsedState = (collapsed: Set<string>) => {
    try {
      localStorage.setItem(`collapsedSections_${projectId}`, JSON.stringify(Array.from(collapsed)));
    } catch (error) {
      console.error('Error saving collapsed sections:', error);
    }
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      saveCollapsedState(newSet);
      return newSet;
    });
  };

  // Fetch sections with tasks from board API (same as TaskBoard)
  const fetchTaskSections = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      // Use the same board endpoint as TaskBoard
      const response = await axios.get(`/api/projects/${projectId}/board`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const sectionsWithTasks = response.data.sections || [];
        setSections(sectionsWithTasks);
      }
    } catch (error: any) {
      console.error('Error fetching task sections:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch task sections',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchTaskSections();
  }, [fetchTaskSections]);

  // Refresh when refreshBoard is called
  useEffect(() => {
    if (refreshBoard) {
      // Listen for refresh events or call directly
      const handleRefresh = () => {
        fetchTaskSections();
      };
      // You can also use a custom event or prop change
      window.addEventListener('taskUpdated', handleRefresh);
      window.addEventListener('taskCreated', handleRefresh);
      window.addEventListener('taskDeleted', handleRefresh);
      return () => {
        window.removeEventListener('taskUpdated', handleRefresh);
        window.removeEventListener('taskCreated', handleRefresh);
        window.removeEventListener('taskDeleted', handleRefresh);
      };
    }
  }, [fetchTaskSections, refreshBoard]);

  // Sort sections by order
  const orderedSections = [...sections].sort((a, b) => a.order - b.order);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Check if due date is today
  const isDueToday = (dueDate?: string): boolean => {
    if (!dueDate) return false;
    try {
      const today = new Date();
      const date = new Date(dueDate);
      
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

  const getAssigneeDisplay = (task: TaskSection['tasks'][0]) => {
    // Use assigneeInfo if available (from board API), otherwise use assignee array
    const assigneeInfo = task.assigneeInfo || [];
    const assigneeIds = task.assignee
      ? (Array.isArray(task.assignee) ? task.assignee : [task.assignee])
      : [];

    if (assigneeInfo.length === 0 && assigneeIds.length === 0) {
      return (
        <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.action.hover }}>
          <Typography variant="caption" sx={{ fontSize: '12px' , color:theme.palette.primary.main }}>?</Typography>
        </Avatar>
      );
    }

    // Prefer assigneeInfo if available
    const displayUsers = assigneeInfo.length > 0
      ? assigneeInfo
      : assigneeIds.map(id => ({ _id: String(id), firstName: '', lastName: '', email: '' }));

    return (
      <Stack direction="row" className='task_user' spacing={0.5}>
        {displayUsers.slice(0, 3).map((user, index) => {
          if (assigneeInfo.length > 0) {
            return (
              <Tooltip key={user._id || index} title={`${user.firstName} ${user.lastName}`.trim() || user.email}>
                <Avatar sx={{
                  width: 28,
                  height: 28,
                  fontSize: '12px',
                  // Match Board view avatar styling (blue background)
                  bgcolor: theme.palette.primary.main,
                  border: `1px solid ${theme.palette.divider}`,
                }}>
                  {user.firstName?.[0] || ''}
                  {user.lastName?.[0] || ''}
                </Avatar>
              </Tooltip>
            );
          }
          return null;
        })}
        {displayUsers.length > 3 && (
          <Tooltip title={`+${displayUsers.length - 3} more`}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.primary.main, fontSize: '12px' }}>
              +{displayUsers.length - 3}
            </Avatar>
          </Tooltip>
        )}
      </Stack>
    );
  };

  const convertTaskToTaskType = (task: TaskSection['tasks'][0], section: TaskSection): Task => {
    // Convert API status format to frontend format
    let taskStatus = task.status || section.name;
    const statusLower = (taskStatus || '').toLowerCase();
    if (statusLower === 'pending') {
      taskStatus = 'Todo';
    } else if (statusLower === 'in-progress') {
      taskStatus = 'In Progress';
    } else if (statusLower === 'completed') {
      taskStatus = 'Done';
    }

    return {
      id: task._id,
      title: task.title,
      description: task.description,
      status: taskStatus,
      priority: task.priority || 'Medium',
      projectId: section.projectId,
      dueDate: task.dueDate || '',
      attachments: task.attachments || [],
      subtasks: task.subtasks || [],
      assignee: task.assignee
        ? (Array.isArray(task.assignee) ? task.assignee.map((id: any) => String(id)) : [String(task.assignee)])
        : [],
    };
  };

  const handleToggleCompletion = async (task: TaskSection['tasks'][0], section: TaskSection) => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const convertedTask = convertTaskToTaskType(task, section);
      const currentStatus = (convertedTask.status || '').toLowerCase();
      const isCurrentlyCompleted = currentStatus.includes('done') || currentStatus.includes('completed');

      const statusOptions = getStatusOptions(section.projectId);
      let newStatus: string;

      if (isCurrentlyCompleted) {
        // Toggle: Mark as incomplete - revert to a non-completed status
        // Try to find a non-completed status (prefer 'In Progress' or first non-completed)
        const nonCompletedStatus = statusOptions.find(
          (opt) => !opt.value.toLowerCase().includes('done') && !opt.value.toLowerCase().includes('completed')
        );
        newStatus = nonCompletedStatus ? nonCompletedStatus.value : (statusOptions[0]?.value || 'Todo');
      } else {
        // Toggle: Mark as completed
        // Find "Done" or "Completed" status from options
        const completedStatus = statusOptions.find(
          (opt) => opt.value.toLowerCase().includes('done') || opt.value.toLowerCase().includes('completed')
        );
        newStatus = completedStatus ? completedStatus.value : 'Done';
      }

      // Convert status to API format
      const statusLower = newStatus.toLowerCase();
      let apiStatus = newStatus;
      if (statusLower === 'todo' || statusLower === 'pending') {
        apiStatus = 'pending';
      } else if (statusLower === 'in progress' || statusLower === 'in-progress') {
        apiStatus = 'in-progress';
      } else if (statusLower === 'done' || statusLower.includes('done') || statusLower.includes('completed')) {
        apiStatus = 'completed';
      }

      // Update task via API
      await axios.patch(
        `/api/projects/${section.projectId}/tasks`,
        {
          taskId: task._id,
          status: apiStatus,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh sections to show updated status
      fetchTaskSections();

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('taskUpdated'));
    } catch (error: any) {
      console.error('Error toggling task completion:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to update task',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {orderedSections.map((section) => {
        const sectionTasks = section.tasks || [];

        const isCollapsed = collapsedSections.has(section._id);
        const sectionBgColor = getSectionBackgroundColor(section.name, section._id);

        return (
          <Box key={section._id} sx={{ mb: 3, padding: '16px', bgcolor: sectionBgColor , borderRadius: '8px'}}>
            <Box
              onClick={() => toggleSection(section._id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                cursor: 'pointer',
                userSelect: 'none',
                '&:hover': {
                  opacity: 0.8,
                },
              }}
            >
              <IconButton
                size="small"
                sx={{
                  p: 0.5,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                {isCollapsed ? (
                  <KeyboardArrowRight fontSize="small" />
                ) : (
                  <KeyboardArrowDown fontSize="small" />
                )}
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '14px',
                  color: theme.palette.text.primary,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  flex: 1,
                }}
              >
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {section.name}
                </Typography>
                <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                  {sectionTasks.length} {sectionTasks.length === 1 ? 'task' : 'tasks'}
                </Typography>
              </Typography>
            </Box>

            {!isCollapsed && (
              <TableContainer component={Paper} variant="outlined" sx={{ borderBottom: 'none' , mt: 1}}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, fontSize: '12px', width: 40 }}></TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '12px' , minWidth:'160px'}}>Task Name</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>Assignee</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '12px' , minWidth:'110px'}}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <span>Due Date</span>
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
                              onClick={(e) => e.stopPropagation()}
                            >
                              <InfoOutlined sx={{ fontSize: '12px' }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>Priority</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '12px' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 600, fontSize: '12px', width: 100 }} align="left">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sectionTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3, color: theme.palette.text.secondary }}>
                          No tasks in this section
                        </TableCell>
                      </TableRow>
                    ) : (
                      sectionTasks.map((task) => {
                        const priorityColor = getPriorityColor(task.priority || 'Medium');
                        const taskStatus = task.status || section.name;
                        const statusColor = getStatusColor(taskStatus, section.projectId);
                        const convertedTask = convertTaskToTaskType(task, section);

                        // Determine if task is completed
                        const taskStatusLower = (taskStatus || '').toLowerCase();
                        const isCompleted = taskStatusLower.includes('done') || taskStatusLower.includes('completed');
                        
                        // Check if task is due today and not completed
                        const taskDueToday = !isCompleted && isDueToday(task.dueDate);

                        return (
                          <TableRow
                            key={task._id}
                            hover
                            sx={{
                              cursor: 'pointer',
                              bgcolor: taskDueToday
                                ? theme.palette.mode === 'dark'
                                  ? 'rgba(127, 29, 29, 0.3)' // Dark red background for dark mode
                                  : 'rgba(254, 242, 242, 0.8)' // Light red background for light mode
                                : 'inherit',
                              '&:hover': {
                                bgcolor: taskDueToday
                                  ? theme.palette.mode === 'dark'
                                    ? 'rgba(153, 27, 27, 0.4)' // Slightly darker red on hover for dark mode
                                    : 'rgba(254, 226, 226, 0.9)' // Slightly darker red on hover for light mode
                                  : theme.palette.action.hover,
                              },
                            }}
                            onClick={() => onEditTask(convertedTask)}
                          >
                            <TableCell
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCompletion(task, section);
                              }}
                              sx={{
                                width: 40,
                                cursor: 'pointer',
                                '&:hover': {
                                  bgcolor: 'transparent',
                                },
                              }}
                            >
                              {isCompleted ? (
                                <CheckCircle
                                  sx={{
                                    color: '#10b981',
                                    fontSize: '20px',
                                    '&:hover': {
                                      color: '#059669',
                                    },
                                  }}
                                />
                              ) : (
                                <CheckCircleOutline
                                  sx={{
                                    color: theme.palette.text.disabled,
                                    fontSize: '20px',
                                    '&:hover': {
                                      color: theme.palette.text.secondary,
                                    },
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {task.title || 'Untitled Task'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {getAssigneeDisplay(task)}
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: isDueToday(task.dueDate)
                                    ? theme.palette.mode === 'dark'
                                      ? '#f87171' // Lighter red for dark mode
                                      : '#ef4444' // Red for light mode
                                    : theme.palette.text.secondary,
                                  fontWeight: isDueToday(task.dueDate) ? 600 : 400,
                                }}
                              >
                                {formatDate(task.dueDate || '')}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getPriorityDisplayName(task.priority || 'Medium', section.projectId)}
                                size="small"
                                sx={{
                                  fontWeight: 500,
                                  minWidth: 'fit-content',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  bgcolor: priorityColor.bg,
                                  color: priorityColor.text,
                                  border: 'none',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusDisplayName(taskStatus, section.projectId)}
                                size="small"
                                sx={{
                                  fontWeight: 500,
                                  minWidth: 'fit-content',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  bgcolor: statusColor.bg,
                                  color: statusColor.text,
                                  border: 'none',
                                }}
                              />
                            </TableCell>
                            <TableCell align="left" onClick={(e) => e.stopPropagation()}>
                              <IconButton
                                size="small"
                                onClick={(e) => handleMenuOpen(e, task._id)}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>

                              <Menu
                                anchorEl={anchorEl}
                                open={open && selectedTaskId === task._id}
                                onClose={handleMenuClose}
                                anchorOrigin={{
                                  vertical: 'bottom',
                                  horizontal: 'right',
                                }}
                                transformOrigin={{
                                  vertical: 'top',
                                  horizontal: 'right',
                                }}
                                PaperProps={{
                                  sx: {
                                    borderRadius: '8px',
                                    minWidth: 140,
                                  },
                                }}
                              >
                                <MenuItem
                                  onClick={() => {
                                    onEditTask(convertedTask);
                                    handleMenuClose();
                                  }}
                                >
                                  <ListItemIcon>
                                    <EditOutlined fontSize="small" />
                                  </ListItemIcon>
                                  <Typography>Edit</Typography>
                                </MenuItem>

                                <MenuItem
                                  onClick={() => {
                                    onDeleteTask(task._id);
                                    handleMenuClose();
                                  }}
                                  sx={{ color: 'error.main' }}
                                >
                                  <ListItemIcon sx={{ color: 'error.main' }}>
                                    <DeleteOutline fontSize="small" />
                                  </ListItemIcon>
                                  <Typography>Delete</Typography>
                                </MenuItem>
                              </Menu>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        );
      })}

      {orderedSections.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            No sections found
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default TaskListView;

