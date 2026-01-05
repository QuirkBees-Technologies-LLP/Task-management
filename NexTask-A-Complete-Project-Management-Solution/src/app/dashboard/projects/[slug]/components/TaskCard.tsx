import React, { useState } from 'react';
import { Button, CardContent, Paper, Stack, Tooltip } from '@mui/material';
import { AddOutlined, Info } from '@mui/icons-material';

import GanttChart from './GanttChart';
import TaskDialog from '@/app/dashboard/tasks/components/TaskModal';
import CardHeader from '@/components/CardHeader';

import { Task } from '@/app/dashboard/tasks/types';
import { mockData } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';

// Defining the default task object as a constant to avoid repetition
const defaultTask: Task = {
  id: 0,
  title: '',
  description: '',
  status: 'Todo',
  priority: 'Medium',
  projectId: '',
  dueDate: '',
};

const TaskCard: React.FC = () => {
  const [taskDialogOpen, setTaskDialogOpen] = useState<boolean>(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);

  const handleOpenDialog = (task: Task | null | any = null): void => {
    setCurrentTask(task || defaultTask);
    setTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = (): void => {
    setTaskDialogOpen(false);
    setCurrentTask(null);
  };

  const handleSaveTask = async (task: Task): Promise<void> => {
    enqueueSnackbar(`${task.title} update sucessful`, { variant: 'success' });
    // Add save logic if needed in the future
    handleCloseTaskDialog();
  };

  return (
    <Paper>
      <CardHeader
        title={
          <Stack direction="row" alignItems="center">
            Tasks
            <Tooltip title="Double click a task to edit">
              <Info fontSize="small" />
            </Tooltip>
          </Stack>
        }
        action={
          <Button onClick={() => handleOpenDialog()} startIcon={<AddOutlined />}>
            Add
          </Button>
        }
      />
      <CardContent>
        <GanttChart handleEditOpen={handleOpenDialog} />
      </CardContent>

      <TaskDialog
        open={taskDialogOpen}
        onClose={handleCloseTaskDialog}
        onSave={handleSaveTask}
        task={currentTask}
        projects={mockData.projects}
      />
    </Paper>
  );
};

export default TaskCard;
