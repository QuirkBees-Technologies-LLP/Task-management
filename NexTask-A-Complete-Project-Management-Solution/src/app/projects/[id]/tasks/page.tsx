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
  Paper,
} from '@mui/material';

// Dynamically import components that use browser APIs (@dnd-kit) to prevent SSR issues
const TaskBoard = dynamicImport(() => import('@/app/dashboard/tasks/components/TaskBoard'), {
  ssr: false,
});
const TaskListView = dynamicImport(() => import('@/app/dashboard/tasks/components/TaskListView'), {
  ssr: false,
});
import DeleteDialog from '@/app/dashboard/tasks/components/DeleteTask';
import TaskDialog from '@/app/dashboard/tasks/components/TaskModal';
import { ViewModule, ViewList } from '@mui/icons-material';
import { ToggleButton, ToggleButtonGroup, Tooltip } from '@mui/material';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { useRouter, useParams } from 'next/navigation';

import { Task, TaskAttachment, Subtask } from '@/app/dashboard/tasks/types';
import { Project } from '@/app/dashboard/projects/types';
import PageHeader from '@/components/PageHeader';

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
  assignee?: string[] | any[] | string; // Array of user IDs (or legacy single ID)
}

export default function ProjectTasksPage() {
  const router = useRouter();
  const params = useParams();
  const theme = useTheme();
  const projectId = params?.id as string;

  // Redirect if no projectId
  useEffect(() => {
    if (!projectId) {
      router.replace('/dashboard/projects');
    }
  }, [projectId, router]);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskDialogOpen, setOpenDialog] = useState(false);
  const [taskDeleteOpen, setTaskDeleteOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [savingTask, setSavingTask] = useState(false);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    if (projectId) {
      fetchTasks();
      fetchProject();
      fetchProjects(); // For the task dialog project selector
    }
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get(`/api/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.project) {
        setProjectName(response.data.project.name || 'Project Tasks');
      }
    } catch (error: any) {
      console.error('Error fetching project:', error);
      // If user is not assigned to project (403), redirect to projects page
      if (error.response?.status === 403) {
        enqueueSnackbar({
          message: 'Access denied. You are not assigned to this project.',
          variant: 'error',
        });
        router.push('/dashboard/projects');
      }
    }
  };

  const fetchTasks = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch tasks for this specific project
      const response = await axios.get(`/api/projects/${projectId}/tasks?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const allTasks = response.data.tasks || [];

        // Convert API tasks to Task format
        const convertedTasks: Task[] = allTasks.map((t: ApiTask) => ({
          id: typeof t._id === 'string' ? t._id : String(t._id || ''),
          title: t.title,
          description: t.description,
          status: t.status === 'pending' ? 'Todo' : t.status === 'in-progress' ? 'In Progress' : t.status === 'completed' ? 'Done' : t.status,
          priority: t.priority || 'Medium',
          projectId: typeof t.projectId === 'string' ? t.projectId : String(t.projectId || projectId),
          dueDate: t.dueDate || '',
          attachments: t.attachments || [],
          subtasks: t.subtasks || [],
          assignee: (t.assignee && Array.isArray(t.assignee)) 
            ? t.assignee.map((id: any) => String(id))
            : (t.assignee ? [String(t.assignee)] : []), // Convert to array format (handle legacy single ID)
        }));

        setTasks(convertedTasks);
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      // If user is not assigned to project (403), redirect to projects page
      if (error.response?.status === 403) {
        enqueueSnackbar({
          message: 'Access denied. You are not assigned to this project.',
          variant: 'error',
        });
        router.push('/dashboard/projects');
      } else {
        enqueueSnackbar({
          message: error.response?.data?.error || 'Failed to fetch tasks',
          variant: 'error',
        });
      }
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
        projectId: projectId || '',
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

      // Ensure task is assigned to current project
      const taskProjectId = task.projectId || projectId;
      if (!taskProjectId) {
        enqueueSnackbar({ message: 'Project ID is required', variant: 'error' });
        setSavingTask(false);
        return;
      }

      // Find the project for this task
      const project = projects.find((p) => String(p.id) === String(taskProjectId));
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
        console.log('Updating task:', { taskId: task.id, projectId: taskProjectId });

        // Build update payload
        const updatePayload: any = {
          taskId: String(task.id),
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate || undefined,
          attachments: task.attachments || [],
          subtasks: task.subtasks || [],
          assignee: task.assignee || [], // Include assignee array
          status: apiStatus,
        };

        const response = await axios.patch(
          `/api/projects/${taskProjectId}/tasks`,
          updatePayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Update response:', response.data);

        // Check if the response indicates success
        const isSuccess = response.status >= 200 && response.status < 300 && 
                         (response.data?.success !== false && response.data?.success !== undefined ? response.data.success : true);
        
        if (!isSuccess) {
          throw new Error(response.data?.error || 'Failed to update task');
        }

        // Task was successfully saved
        enqueueSnackbar({ message: 'Task updated successfully', variant: 'success' });
        // Dispatch event for calendar refresh
        window.dispatchEvent(new CustomEvent('taskUpdated'));

        // Update the task in the tasks array
        const updatedTasks = tasks.map((t) => {
          if (String(t.id) === String(task.id) && String(t.projectId) === String(taskProjectId)) {
            return { ...t, ...task, projectId: taskProjectId };
          }
          return t;
        });
        setTasks(updatedTasks);

        // Update currentTask if it's the same task being edited
        if (currentTask && 
            String(currentTask.id) === String(task.id) && 
            String(currentTask.projectId) === String(taskProjectId)) {
          const updatedCurrentTask = {
            ...currentTask,
            ...task,
            projectId: taskProjectId,
            status: task.status,
          };
          setCurrentTask(updatedCurrentTask);
        }
      } else {
        // Create new task
        console.log('Creating new task:', { projectId: taskProjectId, sectionId: task.sectionId || selectedSectionId });
        const response = await axios.post(
          `/api/projects/${taskProjectId}/tasks`,
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
        
        // Check if the response indicates success
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

      // Refresh tasks list
      try {
        fetchTasks();
      } catch (refreshError) {
        console.error('Error refreshing tasks after save (task was saved successfully):', refreshError);
      }
    } catch (error: any) {
      console.error('Error in handleSaveTask:', error);
      
      // Only show error if it's an actual save error
      if (error.response) {
        enqueueSnackbar({
          message: error.response?.data?.error || 'Failed to save task',
          variant: 'error',
        });
      } else if (error.message && !error.message.includes('refresh')) {
        enqueueSnackbar({
          message: error.message || 'Failed to save task',
          variant: 'error',
        });
      } else {
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

      if (!projectId) {
        enqueueSnackbar({ message: 'Project ID not found', variant: 'error' });
        return;
      }

      const task = tasks.find((t) => String(t.id) === String(id));
      console.log('Found task for deletion:', task);
      if (!task) {
        enqueueSnackbar({ message: 'Task not found', variant: 'error' });
        return;
      }

      const taskIdStr = String(id);
      console.log('Deleting task:', { taskId: taskIdStr, projectId });

      const response = await axios.delete(`/api/projects/${projectId}/tasks?taskId=${taskIdStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Delete response:', response.data);

      enqueueSnackbar({ message: 'Task deleted successfully', variant: 'success' });
      setTaskDeleteOpen(false);
      setCurrentTask(null);
      fetchTasks();
      // Dispatch event for calendar refresh
      window.dispatchEvent(new CustomEvent('taskDeleted'));
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

      if (!projectId) {
        enqueueSnackbar({ message: 'Project ID not found', variant: 'error' });
        return;
      }

      // Convert status to API format
      const apiStatus = task.status === 'Todo' ? 'pending' : task.status === 'In Progress' ? 'in-progress' : task.status === 'Done' ? 'completed' : task.status;

      await axios.patch(
        `/api/projects/${projectId}/tasks`,
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

  if (!projectId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
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
              '& .MuiToggleButton-root': {
                border: `1px solid ${theme.palette.divider}`,
                px: 1.5,
                py: 0.5,
              },
            }}
          >
            <ToggleButton value="board" aria-label="Board view">
              <Tooltip title="Board View">
                <ViewModule fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="list" aria-label="List view">
              <Tooltip title="List View">
                <ViewList fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
        }
      />
      <Box sx={{ width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ p: 2, mt: 2, overflowX: 'hidden', width: '100%' }}>
            {view === 'board' ? (
              <TaskBoard
                projectId={projectId}
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

                  const convertedTask: Task = {
                    id: task._id,
                    title: task.title,
                    description: task.description,
                    status: taskStatus,
                    priority: task.priority || 'Medium',
                    projectId: projectId,
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
                  try {
                    const token = safeLocalStorageGet(accessTokenKey);
                    if (!token) {
                      router.push('/login');
                      return;
                    }

                    // Delete the task directly
                    const response = await axios.delete(
                      `/api/projects/${projectId}/tasks?taskId=${taskId}`,
                      { headers: { Authorization: `Bearer ${token}` } }
                    );

                    if (response.data.success) {
                      enqueueSnackbar({ message: 'Task deleted successfully', variant: 'success' });
                      // Refresh tasks list
                      fetchTasks();
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
                    projectId: projectId,
                    dueDate: '',
                    sectionId: sectionId,
                    assignee: [],
                  });
                }}
              />
            ) : (
              <TaskListView
                projectId={projectId}
                onEditTask={(task) => {
                  // Convert task to proper format
                  handleOpenDialog(task);
                }}
                onDeleteTask={handleDeleteTask}
                refreshBoard={fetchTasks}
              />
            )}
          </Paper>
        )}
      </Box>

      <TaskDialog
        open={taskDialogOpen}
        onClose={handleCloseTaskDialog}
        onSave={handleSaveTask}
        task={currentTask}
        projects={projects}
        saving={savingTask}
        restrictProjectId={projectId}
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
