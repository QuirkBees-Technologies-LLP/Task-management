'use client';

import React, { useState, useEffect } from 'react';
import { Grid2, Paper, CardContent, useTheme, capitalize } from '@mui/material';
import dynamic from 'next/dynamic';

import ReportFilters from './components/Filters';
import TaskCompletionChart from './components/CompletionChart';
import ReportsChart from '@/components/ReportsChart';
import CardHeader from '@/components/CardHeader';
import PageHeader from '@/components/PageHeader';
import { projectColumns } from '../projects/helpers';
import { taskColumns } from '../tasks/helpers';
import { Project, ResponsiveTableColumn as ProjectColumn } from '../projects/types';
import { Task, ResponsiveTableColumn as TaskColumn } from '../tasks/types';
import { FilterState } from './types';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';

// Dynamically imported ExportOptions (client-side only)
const ExportOptions = dynamic(() => import('./components/ExportOptions'), {
  ssr: false,
});

// Main Reports Component
export default function Reports() {
  const router = useRouter();
  const theme = useTheme();

  // State variables
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dataSource, setDataSource] = useState<Project[] | Task[]>([]);
  const [columns, setColumns] = useState<ProjectColumn[] | TaskColumn[]>(projectColumns);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    type: 'projects',
  });

  // Title based on filter type
  const title = capitalize(filters.type);

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, projects, tasks]);

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
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch projects',
        variant: 'error',
      });
    }
  };

  const fetchTasks = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      // Fetch all projects first
      const projectsResponse = await axios.get('/api/projects?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (projectsResponse.data.success) {
        const allProjects = projectsResponse.data.projects || [];
        const allTasks: any[] = [];

        // Fetch tasks for each project
        for (const project of allProjects) {
          try {
            const tasksResponse = await axios.get(`/api/projects/${project._id}/tasks?limit=1000`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (tasksResponse.data.success && tasksResponse.data.tasks) {
              allTasks.push(...tasksResponse.data.tasks);
            }
          } catch (error) {
            console.error(`Error fetching tasks for project ${project._id}:`, error);
          }
        }

        // Convert API tasks to Task format
        const convertedTasks: Task[] = allTasks.map((t: any) => ({
          id: typeof t._id === 'string' ? t._id : (t._id?.toString() || ''),
          title: t.title,
          description: t.description,
          status: t.status === 'pending' ? 'Todo' : t.status === 'in-progress' ? 'In Progress' : t.status === 'completed' ? 'Done' : t.status,
          priority: t.priority || 'Medium',
          projectId: typeof t.projectId === 'string' ? t.projectId : (t.projectId?.toString() || ''),
          dueDate: t.dueDate || '',
        }));

        setTasks(convertedTasks);
      }
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch tasks',
        variant: 'error',
      });
    }
  };

  const applyFilters = () => {
    let filteredData: Project[] | Task[] = [];
    let updatedColumns: ProjectColumn[] | TaskColumn[] = [];

    if (filters.type === 'projects') {
      filteredData = [...projects];
      updatedColumns = projectColumns;

      // Apply status filter
      if (filters.status !== 'all') {
        filteredData = filteredData.filter((project: Project) => {
          const projectStatus = (project.status || '').toLowerCase();
          switch (filters.status) {
            case 'in_progress':
              return projectStatus === 'in progress' || projectStatus === 'active';
            case 'pending':
              return projectStatus === 'pending';
            case 'completed':
              return projectStatus === 'completed' || projectStatus === 'done';
            default:
              return true;
          }
        });
      }
    } else {
      filteredData = [...tasks];
      updatedColumns = taskColumns;

      // Apply status filter
      if (filters.status !== 'all') {
        filteredData = filteredData.filter((item: any) => {
          const taskStatus = (item.status || '').toLowerCase();
          switch (filters.status) {
            case 'in_progress':
              return taskStatus === 'in progress' || taskStatus === 'in-progress';
            case 'pending':
              return taskStatus === 'pending' || taskStatus === 'todo';
            case 'completed':
              return taskStatus === 'completed' || taskStatus === 'done';
            default:
              return true;
          }
        });
      }
    }

    setDataSource(filteredData);
    setColumns(updatedColumns);
  };

  // Handle filter application
  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  return (
    <>
      {/* Page Header with Export Options */}


      {/* Filters Section */}
      <ReportFilters onApplyFilter={handleApplyFilters} />

      {/* Content Grid */}
      <Grid2 container spacing={2}>
        {/* Task Completion Chart */}
        <Grid2 size={{ xs: 12, sm: 7, md: 8 }}>
          <Paper sx={{ height: 380 }}>
            <CardHeader title={`${title} Completion Rate`} />
            <CardContent>
              <TaskCompletionChart data={dataSource} />
            </CardContent>
          </Paper>
        </Grid2>

        {/* Reports Status Chart */}
        <Grid2 size={{ xs: 12, sm: 5, md: 4 }}>
          <Paper sx={{ height: 380 }}>
            <CardHeader title={`${title} Status`} />
            <CardContent>
              <ReportsChart data={dataSource} />
            </CardContent>
          </Paper>
        </Grid2>


      </Grid2>
    </>
  );
}
