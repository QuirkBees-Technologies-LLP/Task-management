'use client';

import React, { useState, useEffect } from 'react';
import dynamicImport from 'next/dynamic';

// Prevent static generation since this page uses browser APIs
export const dynamic = 'force-dynamic';

import {
  Box,
  useTheme,
  CircularProgress,
  Typography,
  Autocomplete,
  TextField,
  Paper,
} from '@mui/material';

// Dynamically import components that use browser APIs (@dnd-kit) to prevent SSR issues
const TaskBoard = dynamicImport(() => import('./components/TaskBoard'), {
  ssr: false,
});
const TaskListView = dynamicImport(() => import('./components/TaskListView'), {
  ssr: false,
});

import DeleteDialog from './components/DeleteTask';
import TaskDialog from './components/TaskModal';
import { ViewModule, ViewList } from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';

import { Task } from './types';
import { Project } from '../projects/types';
import PageHeader from '@/components/PageHeader';

interface ApiTask {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  projectId?: string;
  dueDate?: string;
  assignee?: string[] | any[] | string; // Array of user IDs (or legacy single ID)
}

export default function TaskManagement() {
  const router = useRouter();
  const theme = useTheme();

  // Redirect to projects page if accessed directly
  useEffect(() => {
    router.replace('/dashboard/projects');
  }, [router]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setOpenDialog] = useState(false);
  const [taskDeleteOpen, setTaskDeleteOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [savingTask, setSavingTask] = useState(false);
  const [view, setView] = useState<'board' | 'list'>('board');

  useEffect(() => {
    fetchTasks();
    fetchProjects();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      // Use optimized single-query endpoint instead of N+1 queries
      const response = await axios.get('/api/tasks/all?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const allTasks = response.data.tasks || [];

        // Convert API tasks to Task format
        const convertedTasks: Task[] = allTasks.map((t: ApiTask) => {
          // Format dueDate to YYYY-MM-DD for HTML date input
          let formattedDueDate = '';
          if (t.dueDate) {
            try {
              const date = new Date(t.dueDate);
              if (!isNaN(date.getTime())) {
                formattedDueDate = date.toISOString().split('T')[0];
              }
            } catch (e) {
              // If it's already in YYYY-MM-DD format, use it as is
              if (typeof t.dueDate === 'string' && t.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
                formattedDueDate = t.dueDate;
              }
            }
          }

          return {
            id: typeof t._id === 'string' ? t._id : String(t._id || ''),
            title: t.title,
            description: t.description,
            status: t.status === 'pending' ? 'Todo' : t.status === 'in-progress' ? 'In Progress' : t.status === 'completed' ? 'Done' : t.status,
            priority: t.priority || 'Medium',
            projectId: typeof t.projectId === 'string' ? t.projectId : String(t.projectId || ''),
            dueDate: formattedDueDate,
            attachments: [],
            subtasks: [],
            assignee: (t.assignee && Array.isArray(t.assignee))
              ? t.assignee.map((id: any) => String(id))
              : (t.assignee ? [String(t.assignee)] : []), // Convert to array format (handle legacy single ID)
          };
        });

        setTasks(convertedTasks);
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch tasks',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/projects?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const convertedProjects: Project[] = (response.data.projects || []).map((p: any) => ({
          id: p._id,
          name: p.name,
          description: p.description,
          status: p.status || 'Pending',
          startDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
          endDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : '',
        }));
        setProjects(convertedProjects);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleOpenDialog = (task: Task | null = null) => {
    console.log('handleOpenDialog called with:', task);

    // If task is provided, try to get the latest version from tasks array to ensure we have the most up-to-date status
    // IMPORTANT: Match by both task ID AND project ID to prevent opening tasks from other projects
    let taskToUse = task;
    if (task && task.id && task.projectId) {
      const latestTask = tasks.find(
        (t) => String(t.id) === String(task.id) && String(t.projectId) === String(task.projectId)
      );
      if (latestTask) {
        // Use the latest task from the array to ensure we have the most up-to-date status
        taskToUse = latestTask;
      }
    }

    setCurrentTask(
      taskToUse || {
        id: '0',
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        projectId: '',
        dueDate: '',
        assignee: [],
      }
    );
    setOpenDialog(true);
  };

  const handleCloseTaskDialog = () => {
    setOpenDialog(false);
    setCurrentTask(null);
    setSelectedSectionId('');
  };

  const handleSaveTask = async (task: Task, keepOpen: boolean = false) => {
    if (savingTask) return; // prevent duplicate submissions
    setSavingTask(true);
    console.log('handleSaveTask called with:', task, 'keepOpen:', keepOpen);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        setSavingTask(false);
        return;
      }

      // Validate required fields
      if (!task.projectId) {
        enqueueSnackbar({ message: 'Please select a project', variant: 'error' });
        setSavingTask(false);
        return;
      }

      // Find the project for this task
      const project = projects.find((p) => String(p.id) === String(task.projectId));
      if (!project) {
        enqueueSnackbar({ message: 'Project not found', variant: 'error' });
        setSavingTask(false);
        return;
      }

      // Convert status back to API format
      // Handle standard statuses and custom statuses that contain "done" or "completed"
      const statusLower = task.status.toLowerCase();
      let apiStatus = task.status;
      if (statusLower === 'todo' || statusLower === 'pending') {
        apiStatus = 'pending';
      } else if (statusLower === 'in progress' || statusLower === 'in-progress') {
        apiStatus = 'in-progress';
      } else if (statusLower === 'done' || statusLower.includes('done') || statusLower.includes('completed')) {
        apiStatus = 'completed';
      }

      if (task.id && task.id !== '0' && task.id !== 0) {
        // Update existing task
        console.log('Updating task:', { taskId: task.id, projectId: task.projectId });

        // Build update payload - only include status if it's different from current
        // Ensure dueDate is properly formatted (YYYY-MM-DD) or undefined if empty
        let formattedDueDate: string | undefined = undefined;
        if (task.dueDate && task.dueDate.trim() !== '') {
          // If it's already in YYYY-MM-DD format, use it
          if (task.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDueDate = task.dueDate;
          } else {
            // Try to parse and format
            try {
              const date = new Date(task.dueDate);
              if (!isNaN(date.getTime())) {
                formattedDueDate = date.toISOString().split('T')[0];
              }
            } catch (e) {
              // If parsing fails, set to undefined
              formattedDueDate = undefined;
            }
          }
        }

        const updatePayload: any = {
          taskId: String(task.id),
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: formattedDueDate,
          attachments: task.attachments || [],
          subtasks: task.subtasks || [],
          assignee: task.assignee || [], // Include assignee array
        };

        // Always include status in the update payload to ensure it's saved
        // This is important for "Mark complete" functionality
        updatePayload.status = apiStatus;

        const response = await axios.patch(
          `/api/projects/${task.projectId}/tasks`,
          updatePayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Update response:', response.data);

        // Check if the response indicates success (HTTP 2xx status and success flag)
        const isSuccess = response.status >= 200 && response.status < 300 &&
          (response.data?.success !== false && response.data?.success !== undefined ? response.data.success : true);

        if (!isSuccess) {
          throw new Error(response.data?.error || 'Failed to update task');
        }

        // Task was successfully saved
        enqueueSnackbar({ message: 'Task updated successfully', variant: 'success' });
        // Dispatch event for calendar refresh
        window.dispatchEvent(new CustomEvent('taskUpdated'));

        // Update the task in the tasks array to reflect the new status
        // This ensures that when reopening the task, it shows the correct status
        // IMPORTANT: Match by both task ID AND project ID to prevent updating tasks in other projects
        const updatedTasks = tasks.map((t) => {
          if (String(t.id) === String(task.id) && String(t.projectId) === String(task.projectId)) {
            return { ...t, ...task };
          }
          return t;
        });
        setTasks(updatedTasks);

        // Update currentTask if it's the same task being edited (important for keepOpen scenario)
        // This ensures the TaskModal re-renders with the updated status immediately
        // IMPORTANT: Match by both task ID AND project ID to prevent updating tasks from other projects
        if (currentTask &&
          String(currentTask.id) === String(task.id) &&
          String(currentTask.projectId) === String(task.projectId)) {
          // Create a new object reference to trigger re-render
          const updatedCurrentTask = {
            ...currentTask,
            ...task,
            status: task.status, // Ensure status is explicitly set
          };
          setCurrentTask(updatedCurrentTask);
        }
      } else {
        // Create new task
        console.log('Creating new task:', { projectId: task.projectId, sectionId: task.sectionId || selectedSectionId });
        const response = await axios.post(
          `/api/projects/${task.projectId}/tasks`,
          {
            title: task.title,
            description: task.description,
            status: apiStatus,
            priority: task.priority,
            dueDate: task.dueDate || undefined,
            attachments: task.attachments || [],
            subtasks: task.subtasks || [],
            sectionId: task.sectionId || selectedSectionId || undefined,
            assignee: task.assignee || [], // Include assignee array
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Create response:', response.data);

        // Check if the response indicates success (HTTP 2xx status and success flag)
        const isSuccess = response.status >= 200 && response.status < 300 &&
          (response.data?.success !== false && response.data?.success !== undefined ? response.data.success : true);

        if (!isSuccess) {
          throw new Error(response.data?.error || 'Failed to create task');
        }

        enqueueSnackbar({ message: 'Task created successfully', variant: 'success' });
        // Dispatch event for calendar refresh
        window.dispatchEvent(new CustomEvent('taskCreated'));
        // Clear selected section after task creation
        setSelectedSectionId('');
      }

      // Only close dialog if keepOpen is false (default behavior for Save button)
      if (!keepOpen) {
        handleCloseTaskDialog();
      }

      // Refresh both tasks list and task view (don't let refresh errors affect save success)
      // Wrap in try-catch to prevent refresh errors from showing as save errors
      try {
        fetchTasks();
      } catch (refreshError) {
        console.error('Error refreshing tasks after save (task was saved successfully):', refreshError);
        // Don't show error toast - task was saved successfully
      }

      // Force refresh of TaskBoard to show updated status immediately (especially for keepOpen scenario)
      if (selectedProjectId) {
        const currentId = selectedProjectId;
        setSelectedProjectId('');
        setTimeout(() => setSelectedProjectId(currentId), 50);
      }
    } catch (error: any) {
      console.error('Error in handleSaveTask:', error);

      // Only show error if it's an actual save error (not a refresh error)
      // Check if it's an axios error with a response (actual API error)
      if (error.response) {
        // This is an actual API error from the save operation
        enqueueSnackbar({
          message: error.response?.data?.error || 'Failed to save task',
          variant: 'error',
        });
      } else if (error.message && !error.message.includes('refresh')) {
        // This is a thrown error from the save logic
        enqueueSnackbar({
          message: error.message || 'Failed to save task',
          variant: 'error',
        });
      } else {
        // Unknown error, but don't show false error
        console.error('Unexpected error in handleSaveTask:', error);
      }
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = async (id: number | string) => {
    console.log('handleDeleteTask called with id:', id);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      // IMPORTANT: When deleting, we should ideally have projectId context
      // For now, find by ID only but backend will validate projectId
      // If we have selectedProjectId, use it to scope the search
      const task = selectedProjectId
        ? tasks.find(
          (t) => String(t.id) === String(id) && String(t.projectId) === String(selectedProjectId)
        )
        : tasks.find((t) => String(t.id) === String(id));
      console.log('Found task for deletion:', task);
      if (!task || !task.projectId) {
        enqueueSnackbar({ message: 'Task or project not found', variant: 'error' });
        return;
      }

      const taskIdStr = String(id);
      const projectIdStr = String(task.projectId);
      console.log('Deleting task:', { taskId: taskIdStr, projectId: projectIdStr });

      const response = await axios.delete(`/api/projects/${projectIdStr}/tasks?taskId=${taskIdStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Delete response:', response.data);

      enqueueSnackbar({ message: 'Task deleted successfully', variant: 'success' });
      setTaskDeleteOpen(false);
      setCurrentTask(null);
      fetchTasks();
      // Dispatch event for calendar refresh
      window.dispatchEvent(new CustomEvent('taskDeleted'));
      // Force re-render of task view
      if (selectedProjectId) {
        const currentId = selectedProjectId;
        setSelectedProjectId('');
        setTimeout(() => setSelectedProjectId(currentId), 100);
      }
    } catch (error: any) {
      console.error('Error in handleDeleteTask:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete task',
        variant: 'error',
      });
    }
  };

  const handleStatusChange = async (task: Task) => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      if (!task.projectId) {
        enqueueSnackbar({ message: 'Project ID not found', variant: 'error' });
        return;
      }

      // Convert status to API format
      const apiStatus = task.status === 'Todo' ? 'pending' : task.status === 'In Progress' ? 'in-progress' : task.status === 'Done' ? 'completed' : task.status;

      await axios.patch(
        `/api/projects/${task.projectId}/tasks`,
        {
          taskId: task.id,
          status: apiStatus,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Refresh tasks after status update
      fetchTasks();
    } catch (error: any) {
      console.error('Error updating task status:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to update task status',
        variant: 'error',
      });
      // Refresh to revert visual change if API call failed
      fetchTasks();
    }
  };


  return (
    <>
      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: "8px",
          mb: 3,
        }}
      >
        <PageHeader
          title="Tasks"
          action={
            <ToggleButtonGroup
              value={view}
              exclusive
              onChange={(_, newView) => {
                if (newView !== null) {
                  setView(newView);
                }
              }}
              size="small"
              sx={{
                backgroundColor: theme.palette.mode === 'dark'
                  ? 'rgba(255,255,255,0.06)'
                  : 'rgba(0,0,0,0.04)',
                borderRadius: '8px',
                p: 0.5,
                gap: 0.5,
                '& .MuiToggleButtonGroup-grouped': {
                  border: 'none',
                },
              }}
            >
              {/* Board Tab */}
              <ToggleButton
                value="board"
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: '8px !important',
                  textTransform: 'none',
                  display: 'flex',
                  gap: 1,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: theme.palette.text.secondary,

                  '&.Mui-selected': {
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 0 0 1px rgba(255,255,255,0.08)'
                      : '0 1px 4px rgba(0,0,0,0.12)',
                  },

                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <ViewModule fontSize="small" />
                Board
              </ToggleButton>

              {/* List Tab */}
              <ToggleButton
                value="list"
                sx={{
                  px: 2,
                  py: 1,
                  borderRadius: '8px !important',
                  textTransform: 'none',
                  display: 'flex',
                  gap: 1,
                  fontSize: "14px",
                  fontWeight: 500,
                  color: theme.palette.text.secondary,

                  '&.Mui-selected': {
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    boxShadow: theme.palette.mode === 'dark'
                      ? '0 0 0 1px rgba(255,255,255,0.08)'
                      : '0 1px 4px rgba(0,0,0,0.12)',
                  },

                  '&:hover': {
                    backgroundColor: theme.palette.action.hover,
                  },
                }}
              >
                <ViewList fontSize="small" />
                List
              </ToggleButton>
            </ToggleButtonGroup>
          }
        />
      </Box>
      <Box sx={{ width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {projects.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  options={projects}
                  getOptionLabel={(option) => option.name}
                  value={projects.find((p) => p.id === selectedProjectId) || null}
                  onChange={(_, newValue) => {
                    setSelectedProjectId(newValue ? String(newValue.id) : '');
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Project" size="small" sx={{ minWidth: 300 }} />
                  )}
                />
              </Box>
            )}
            {selectedProjectId ? (
              <Paper sx={{ p: 2, mt: 2, overflowX: 'hidden', width: '100%' }}>
                {view === 'board' ? (
                  <TaskBoard
                    projectId={selectedProjectId}
                    refreshBoard={fetchTasks}
                    onEditTask={(task) => {
                      // Get the actual task status from the task object
                      // Convert API status format to frontend format if needed
                      let taskStatus = (task as any).status || 'Todo';
                      const statusLower = (taskStatus || '').toLowerCase();
                      if (statusLower === 'pending') {
                        taskStatus = 'Todo';
                      } else if (statusLower === 'in-progress') {
                        taskStatus = 'In Progress';
                      } else if (statusLower === 'completed') {
                        taskStatus = 'Done';
                      }
                      // If it's already in frontend format or custom status, use as is

                      const convertedTask: Task = {
                        id: task._id,
                        title: task.title,
                        description: task.description,
                        status: taskStatus,
                        priority: task.priority || 'Medium',
                        projectId: selectedProjectId,
                        dueDate: task.dueDate || '',
                        attachments: task.attachments || [],
                        subtasks: task.subtasks || [],
                        assignee: (task.assignee && Array.isArray(task.assignee))
                          ? task.assignee.map((id: any) => String(id))
                          : (task.assignee ? [String(task.assignee)] : []),
                      };
                      handleOpenDialog(convertedTask);
                    }}
                    onDeleteTask={async (taskId) => {
                      // Directly delete using the taskId from TaskBoard
                      // TaskBoard passes task._id which is the MongoDB ID
                      try {
                        const token = safeLocalStorageGet(accessTokenKey);
                        if (!token) {
                          router.push('/login');
                          return;
                        }

                        if (!selectedProjectId) {
                          enqueueSnackbar({ message: 'Project not selected', variant: 'error' });
                          return;
                        }

                        // Delete the task directly
                        const response = await axios.delete(
                          `/api/projects/${selectedProjectId}/tasks?taskId=${taskId}`,
                          { headers: { Authorization: `Bearer ${token}` } }
                        );

                        if (response.data.success) {
                          enqueueSnackbar({ message: 'Task deleted successfully', variant: 'success' });
                          // Refresh tasks list
                          fetchTasks();
                          // Force TaskBoard refresh by toggling project selection
                          const currentId = selectedProjectId;
                          setSelectedProjectId('');
                          setTimeout(() => setSelectedProjectId(currentId), 50);
                        }
                      } catch (error: any) {
                        console.error('Error deleting task:', error);
                        enqueueSnackbar({
                          message: error.response?.data?.error || 'Failed to delete task',
                          variant: 'error',
                        });
                      }
                    }}
                    onAddTask={(sectionId) => {
                      setSelectedSectionId(sectionId);
                      handleOpenDialog({
                        id: '0',
                        title: '',
                        description: '',
                        status: 'Todo',
                        priority: 'Medium',
                        projectId: selectedProjectId,
                        dueDate: '',
                        sectionId: sectionId,
                        assignee: [],
                      });
                    }}
                  />
                ) : (
                  <TaskListView
                    projectId={selectedProjectId}
                    onEditTask={(task) => {
                      // Convert task to proper format
                      handleOpenDialog(task);
                    }}
                    onDeleteTask={handleDeleteTask}
                    refreshBoard={fetchTasks}
                  />
                )}
              </Paper>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  Please select a project to view tasks
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      <TaskDialog
        open={taskDialogOpen}
        onClose={handleCloseTaskDialog}
        onSave={handleSaveTask}
        task={currentTask}
        projects={projects}
        saving={savingTask}
      />

      <DeleteDialog
        open={taskDeleteOpen}
        onClose={() => setTaskDeleteOpen(false)}
        onDelete={() => {
          if (currentTask) {
            handleDeleteTask(currentTask.id);
            setTaskDeleteOpen(false);
          }
        }}
      />
    </>
  );
}
