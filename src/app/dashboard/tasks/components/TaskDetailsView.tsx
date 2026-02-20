'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  Typography,
  Chip,
  Stack,
  Divider,
  useTheme,
  Tooltip,
} from '@mui/material';
import { CloseOutlined, InfoOutlined } from '@mui/icons-material';
import { Task } from '../types';
import { getPriorityColor as getPriorityColorUtil, getPriorityDisplayName } from '../utils/priorityColors';
import { getStatusColor, getStatusDisplayName } from '../utils/statusColors';

interface TaskDetailsViewProps {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onEdit?: (task: Task) => void;
}

const TaskDetailsView: React.FC<TaskDetailsViewProps> = ({ open, onClose, task, onEdit }) => {
  const theme = useTheme();

  if (!task) return null;

  const getPriorityColor = getPriorityColorUtil;
  

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
      });
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 2,
        }}
      >
        <Typography variant="h5" component="div" sx={{ fontWeight: 600 }}>
          Task Details
        </Typography>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: theme.palette.text.secondary,
          }}
        >
          <CloseOutlined />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {/* Title */}
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: theme.palette.text.primary,
              }}
            >
              {task.title}
            </Typography>
          </Box>

          <Divider />

          {/* Status and Priority */}
          <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ gap: 1 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 0.5,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                Status
              </Typography>
              <Chip
                label={getStatusDisplayName(task.status || 'Todo', task.projectId)}
                size="small"
                sx={{
                  height: '24px',
                  fontSize: '12px',
                  fontWeight: 500,
                  bgcolor: getStatusColor(task.status || 'Todo', task.projectId).bg,
                  color: getStatusColor(task.status || 'Todo', task.projectId).text,
                  border: 'none',
                }}
              />
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 0.5,
                  color: theme.palette.text.secondary,
                  fontWeight: 500,
                }}
              >
                Priority
              </Typography>
              <Chip
                label={getPriorityDisplayName(task.priority || 'Medium', task.projectId)}
                size="small"
                sx={{
                  height: '24px',
                  fontSize: '12px',
                  fontWeight: 500,
                  bgcolor: getPriorityColor(task.priority || '').bg,
                  color: getPriorityColor(task.priority || '').text,
                  border: 'none',
                }}
              />
            </Box>
          </Stack>

          <Divider />

          {/* Description */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                mb: 1,
                color: theme.palette.text.secondary,
                fontWeight: 600,
              }}
            >
              Description
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.primary,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {task.description || 'No description provided'}
            </Typography>
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
            <Typography
              variant="body2"
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
          </Box>

          {/* Project ID */}
          {task.projectId && (
            <>
              <Divider />
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    color: theme.palette.text.secondary,
                    fontWeight: 600,
                  }}
                >
                  Project ID
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.primary,
                  }}
                >
                  {task.projectId}
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsView;


