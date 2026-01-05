'use client';
import React, { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { Task, TaskDialogProps } from '../types';

function TaskDialog({ open, onClose, onSave, task, projects }: TaskDialogProps) {
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  useEffect(() => {
    setEditedTask(task);
  }, [task]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>
  ) => {
    const { name, value } = e.target;
    setEditedTask((prevTask) => (prevTask ? { ...prevTask, [name as string]: value } : null));
  };

  const handleSave = () => {
    if (editedTask) {
      onSave(editedTask);
    }
  };

  if (!editedTask) return null;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{editedTask.id ? 'Edit Task' : 'Add New Task'}</DialogTitle>
      <DialogContent>
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
        <TextField
          margin="dense"
          name="description"
          label="Description"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={editedTask.description}
          onChange={handleChange}
        />
        <TextField
          select
          margin="dense"
          name="status"
          label="Status"
          fullWidth
          value={editedTask.status}
          onChange={handleChange}
        >
          <MenuItem value="Todo">Todo</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Done">Done</MenuItem>
        </TextField>
        <TextField
          select
          margin="dense"
          name="priority"
          label="Priority"
          fullWidth
          value={editedTask.priority}
          onChange={handleChange}
        >
          <MenuItem value="Low">Low</MenuItem>
          <MenuItem value="Medium">Medium</MenuItem>
          <MenuItem value="High">High</MenuItem>
        </TextField>
        <TextField
          select
          margin="dense"
          name="projectId"
          label="Project"
          fullWidth
          value={editedTask.projectId}
          onChange={handleChange}
        >
          {projects.map((project) => (
            <MenuItem key={project.id} value={project.id}>
              {project.name}
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
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default TaskDialog;
