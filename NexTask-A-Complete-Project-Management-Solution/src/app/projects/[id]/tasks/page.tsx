'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Avatar,
  Tooltip,
  InputAdornment,
  Pagination,
} from '@mui/material';
import {
  AddOutlined,
  EditOutlined,
  DeleteOutline,
  History,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';

interface Task {
  _id: string;
  title: string;
  description: string;
  status: string;
  assignee?: string;
  assigneeInfo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  statusHistory?: Array<{
    status: string;
    timestamp: string;
    changedBy: string;
  }>;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TaskStatus {
  value: string;
  label: string;
  order: number;
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
}

const ProjectTasksPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [statusesLoading, setStatusesLoading] = useState(true);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee: '',
    status: '',
  });

  // Pagination and filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    if (projectId) {
      fetchTasks();
    }
  }, [projectId, page, search, sortBy, sortOrder]);

  useEffect(() => {
    if (projectId) {
      fetchUsers();
      fetchTaskStatuses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]); // Only fetch users and statuses once when projectId changes

  // Set default status when statuses are loaded
  useEffect(() => {
    if (taskStatuses.length > 0 && !formData.status) {
      setFormData((prev) => ({
        ...prev,
        status: taskStatuses[0].value,
      }));
    }
  }, [taskStatuses]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy,
        sortOrder,
        ...(search && { search }),
      });

      const response = await axios.get(`/api/projects/${projectId}/tasks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setTasks(response.data.tasks || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
        } else {
          setTotalPages(1);
        }
      } else {
        setTasks([]);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
      setTotalPages(1);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch tasks',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const fetchUsers = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        return;
      }

      const response = await axios.get('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data || []);
    } catch (error: any) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchTaskStatuses = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        return;
      }

      const response = await axios.get('/api/config/task-statuses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success && response.data.statuses) {
        // Sort by order
        const sortedStatuses = [...response.data.statuses].sort((a: TaskStatus, b: TaskStatus) => a.order - b.order);
        setTaskStatuses(sortedStatuses);
      }
    } catch (error: any) {
      console.error('Error fetching task statuses:', error);
      // Fallback to default statuses if API fails
      setTaskStatuses([
        { value: 'pending', label: 'Pending', order: 0, color: 'default' },
        { value: 'in-progress', label: 'In Progress', order: 1, color: 'warning' },
        { value: 'completed', label: 'Completed', order: 2, color: 'success' },
      ]);
    } finally {
      setStatusesLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setSelectedTask(null);
    // Use first status as default
    const defaultStatus = taskStatuses.length > 0 ? taskStatuses[0].value : 'pending';
    setFormData({
      title: '',
      description: '',
      assignee: '',
      status: defaultStatus,
    });
    setTaskDialogOpen(true);
  };

  const handleOpenEditDialog = (task: Task) => {
    setSelectedTask(task);
    // Convert assignee ObjectId to string if it exists
    const assigneeValue = task.assignee
      ? (typeof task.assignee === 'object' && task.assignee && '_id' in task.assignee
        ? (task.assignee as any)._id.toString()
        : String(task.assignee))
      : '';
    setFormData({
      title: task.title,
      description: task.description,
      assignee: assigneeValue,
      status: task.status,
    });
    setTaskDialogOpen(true);
  };

  const handleSaveTask = async () => {
    if (!formData.title || !formData.description) {
      enqueueSnackbar({
        message: 'Title and description are required',
        variant: 'error',
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

      if (selectedTask && selectedTask._id) {
        // Update existing task
        const taskIdString = typeof selectedTask._id === 'object' && selectedTask._id !== null
          ? (selectedTask._id as any).toString()
          : String(selectedTask._id ?? '');
        const updateResponse = await axios.patch(
          `/api/projects/${projectId}/tasks`,
          {
            taskId: taskIdString,
            ...formData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (updateResponse.data.success) {
          enqueueSnackbar({
            message: 'Task updated successfully',
            variant: 'success',
          });
        } else {
          throw new Error(updateResponse.data.error || 'Failed to update task');
        }
      } else {
        // Create new task
        const createResponse = await axios.post(
          `/api/projects/${projectId}/tasks`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (createResponse.data.success) {
          enqueueSnackbar({
            message: 'Task created successfully',
            variant: 'success',
          });
        } else {
          throw new Error(createResponse.data.error || 'Failed to create task');
        }
      }

      setTaskDialogOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error: any) {
      console.error('Error saving task:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to save task';
      enqueueSnackbar({
        message: errorMessage,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !selectedTask._id) return;

    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      // TypeScript guard: we know selectedTask._id exists from the check above
      const taskId = selectedTask._id;
      const taskIdString = typeof taskId === 'object' && taskId !== null
        ? taskId.toString()
        : String(taskId ?? '');
      const deleteResponse = await axios.delete(`/api/projects/${projectId}/tasks?taskId=${taskIdString}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (deleteResponse.data.success) {
        enqueueSnackbar({
          message: 'Task deleted successfully',
          variant: 'success',
        });
      } else {
        throw new Error(deleteResponse.data.error || 'Failed to delete task');
      }

      setDeleteDialogOpen(false);
      setSelectedTask(null);
      fetchTasks();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete task';
      enqueueSnackbar({
        message: errorMessage,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: string) => {
    if (!task._id) return;
    
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      // TypeScript guard: we know task._id exists from the check above
      const taskId = task._id;
      const taskIdString = typeof taskId === 'object' && taskId !== null
        ? taskId.toString()
        : String(taskId);
      const statusResponse = await axios.patch(
        `/api/projects/${projectId}/tasks`,
        {
          taskId: taskIdString,
          status: newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (statusResponse.data.success) {
        enqueueSnackbar({
          message: 'Task status updated successfully',
          variant: 'success',
        });
        fetchTasks();
      } else {
        throw new Error(statusResponse.data.error || 'Failed to update task status');
      }
    } catch (error: any) {
      console.error('Error updating task status:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to update task status';
      enqueueSnackbar({
        message: errorMessage,
        variant: 'error',
      });
    }
  };

  const getStatusColor = (status: string) => {
    const statusConfig = taskStatuses.find((s) => s.value === status);
    return statusConfig?.color || 'default';
  };

  const getAvailableStatuses = (currentStatus: string) => {
    const currentStatusConfig = taskStatuses.find((s) => s.value === currentStatus);
    if (!currentStatusConfig) return taskStatuses;

    const currentOrder = currentStatusConfig.order;
    // Return all statuses from current status onwards (no backward progression)
    return taskStatuses.filter((s) => s.order >= currentOrder);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (loading || statusesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="Project Tasks"
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={handleOpenCreateDialog}
          >
            Add Task
          </Button>
        }
      />

      <Box sx={{ mt: 3 }}>
        {/* Search and Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack spacing={2} direction={{ xs: 'column', md: 'row' }} alignItems="center">
            <TextField
              placeholder="Search tasks by title or description..."
              value={search}
              onChange={handleSearchChange}
              size="small"
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                label="Sort By"
              >
                <MenuItem value="createdAt">Created Date</MenuItem>
                <MenuItem value="title">Title</MenuItem>
                <MenuItem value="status">Status</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Order</InputLabel>
              <Select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setPage(1);
                }}
                label="Order"
              >
                <MenuItem value="asc">Ascending</MenuItem>
                <MenuItem value="desc">Descending</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Paper>
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No tasks found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task) => {
                    const assigneeName = task.assigneeInfo
                      ? `${task.assigneeInfo.firstName} ${task.assigneeInfo.lastName}`
                      : 'Unassigned';
                    const availableStatuses = getAvailableStatuses(task.status);

                    return (
                      <TableRow key={task._id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {task.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {task.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {task.assigneeInfo ? (
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                                {task.assigneeInfo.firstName.charAt(0)}
                                {task.assigneeInfo.lastName.charAt(0)}
                              </Avatar>
                              <Typography variant="body2">{assigneeName}</Typography>
                            </Stack>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Unassigned
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              label={taskStatuses.find((s) => s.value === task.status)?.label || task.status}
                              color={getStatusColor(task.status) as any}
                              size="small"
                            />
                            {availableStatuses.length > 1 && (
                              <Select
                                value={task.status}
                                onChange={(e) => handleStatusChange(task, e.target.value)}
                                size="small"
                                sx={{ minWidth: 120 }}
                              >
                                {availableStatuses.map((status) => (
                                  <MenuItem key={status.value} value={status.value}>
                                    {status.label}
                                  </MenuItem>
                                ))}
                              </Select>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            {task.statusHistory && task.statusHistory.length > 0 && (
                              <Tooltip title="View Status History">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedTask(task);
                                    setHistoryDialogOpen(true);
                                  }}
                                  color="info"
                                >
                                  <History fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleOpenEditDialog(task)}
                              color="primary"
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedTask(task);
                                setDeleteDialogOpen(true);
                              }}
                              color="error"
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}
      </Box>

      {/* Create/Edit Task Dialog */}
      <Dialog
        open={taskDialogOpen}
        onClose={() => setTaskDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{selectedTask ? 'Edit Task' : 'Create Task'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              name="title"
              label="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              required
              fullWidth
              variant="outlined"
            />

            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              required
              fullWidth
              multiline
              rows={4}
              variant="outlined"
            />

            <FormControl fullWidth>
              <InputLabel>Assignee</InputLabel>
              <Select
                name="assignee"
                value={formData.assignee}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, assignee: e.target.value }))
                }
                label="Assignee"
                disabled={usersLoading}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                label="Status"
                disabled={statusesLoading}
              >
                {selectedTask ? (
                  getAvailableStatuses(selectedTask.status).map((statusConfig) => (
                    <MenuItem key={statusConfig.value} value={statusConfig.value}>
                      {statusConfig.label}
                    </MenuItem>
                  ))
                ) : (
                  taskStatuses.map((statusConfig) => (
                    <MenuItem key={statusConfig.value} value={statusConfig.value}>
                      {statusConfig.label}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveTask}
            variant="contained"
            disabled={saving || !formData.title || !formData.description}
            startIcon={saving && <CircularProgress size={15} color="inherit" />}
          >
            {selectedTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Task</DialogTitle>
        <DialogContent>
          {selectedTask && (
            <Typography>
              Are you sure you want to delete <strong>{selectedTask.title}</strong>? This action
              cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteTask}
            variant="contained"
            color="error"
            disabled={saving}
            startIcon={saving && <CircularProgress size={15} color="inherit" />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status History Dialog */}
      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Status History</DialogTitle>
        <DialogContent>
          {selectedTask?.statusHistory && selectedTask.statusHistory.length > 0 ? (
            <Stack spacing={2} sx={{ pt: 2 }}>
              {selectedTask.statusHistory
                .slice()
                .reverse()
                .map((entry, index) => (
                  <Box key={index}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Chip
                        label={taskStatuses.find((s) => s.value === entry.status)?.label || entry.status}
                        color={getStatusColor(entry.status) as any}
                        size="small"
                      />
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(entry.timestamp)}
                      </Typography>
                    </Stack>
                  </Box>
                ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No status history available
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ProjectTasksPage;


