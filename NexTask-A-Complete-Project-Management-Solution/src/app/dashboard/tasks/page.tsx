'use client';
import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Tabs,
  Tab,
  Stack,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  AddOutlined,
  DeleteOutline,
  EditOutlined,
  TableRowsOutlined,
  ViewWeekOutlined,
} from '@mui/icons-material';

import TaskBoard from './components/TaskBoard';
import PageHeader from '@/components/PageHeader';
import ResponsiveTable from '@/components/Table';
import DeleteDialog from './components/DeleteTask';
import TaskDialog from './components/TaskModal';

import { taskColumns } from './helpers';
import { Task } from './types';
import { Project } from '../projects/types';
import { mockData } from '@/utils/constants';

const mockProjects: Project[] = mockData.projects;
const mockTasks: Task[] = mockData.tasks;

const fetchTasks = () =>
  new Promise<Task[]>((resolve) => setTimeout(() => resolve(mockTasks), 500));
const saveTask = () => new Promise<void>((resolve) => setTimeout(resolve, 500));
const deleteTask = () => new Promise<void>((resolve) => setTimeout(resolve, 500));

export default function TaskManagement() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [taskDialogOpen, setOpenDialog] = useState(false);
  const [taskDeleteOpen, setTaskDeleteOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [currTab, setCurrTab] = useState('board');

  useEffect(() => {
    fetchTasks().then(setTasks);
  }, []);

  const handleOpenDialog = (task: Task | null = null) => {
    setCurrentTask(
      task || {
        id: 0,
        title: '',
        description: '',
        status: 'Todo',
        priority: 'Medium',
        projectId: '',
        dueDate: '',
      }
    );
    setOpenDialog(true);
  };

  const handleCloseTaskDialog = () => {
    setOpenDialog(false);
    setCurrentTask(null);
  };

  const handleSaveTask = async (task: Task) => {
    await saveTask();
    setTasks((prevTasks: any) => {
      const index = prevTasks.findIndex((t) => t.id === task.id);
      if (index !== -1) {
        return [...prevTasks.slice(0, index), task, ...prevTasks.slice(index + 1)];
      } else {
        return [...prevTasks, { ...task, id: String(prevTasks.length + 1) }];
      }
    });
    handleCloseTaskDialog();
  };

  const handleDeleteTask = async (id: number) => {
    await deleteTask();
    setTasks((prevTasks) => prevTasks.filter((task: Task) => task.id !== id));
  };

  return (
    <>
      <PageHeader
        title="Tasks"
        action={
          <Stack direction="row" alignItems="center" spacing={2}>
            <Tabs value={currTab} onChange={(_, value) => setCurrTab(value)} sx={{ my: 2 }}>
              <Tab icon={<ViewWeekOutlined />} value={'board'} sx={{ minWidth: 50 }} />
              <Tab icon={<TableRowsOutlined />} value={'table'} sx={{ minWidth: 50 }} />
            </Tabs>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddOutlined />}
              onClick={() => handleOpenDialog()}
            >
              New Task
            </Button>
          </Stack>
        }
      />
      <Box>
        {currTab === 'board' ? (
          <TaskBoard tasks={tasks} onEditTask={handleOpenDialog} onDeleteTask={handleDeleteTask} />
        ) : (
          <Paper sx={{ p: isSmallScreen ? 2 : 0 }}>
            <ResponsiveTable
              columns={taskColumns}
              data={tasks}
              listKeys={{
                primaryKeys: ['title', 'status'],
                secondaryKeys: ['dueDate', 'priority', 'description'],
              }}
              renderActions={(currTask) => (
                <Stack direction={'row'}>
                  <IconButton onClick={() => handleOpenDialog(currTask)}>
                    <EditOutlined color="primary" />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setTaskDeleteOpen(true);
                    }}
                  >
                    <DeleteOutline color="warning" />
                  </IconButton>
                </Stack>
              )}
            />
          </Paper>
        )}
      </Box>

      <TaskDialog
        open={taskDialogOpen}
        onClose={handleCloseTaskDialog}
        onSave={handleSaveTask}
        task={currentTask}
        projects={mockProjects}
      />

      <DeleteDialog
        open={taskDeleteOpen}
        onClose={() => setTaskDeleteOpen(false)}
        onDelete={() => {}}
      />
    </>
  );
}
