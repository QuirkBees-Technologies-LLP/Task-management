import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Typography,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
} from '@mui/material';
import { InfoOutlined, MoreVert, DeleteOutline, CheckCircle, CheckCircleOutline, CalendarToday, CheckBox } from '@mui/icons-material';
import { SortableItemProps } from '../types';
import { getPriorityColor as getPriorityColorUtil, getPriorityDisplayName } from '../utils/priorityColors';
import { getStatusColor, getStatusDisplayName } from '../utils/statusColors';

export const SortableItem: React.FC<SortableItemProps> = ({
  id,
  item: task,
  onEditTask = () => { },
  onDeleteTask = () => { },
}) => {
  const theme = useTheme();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: dndIsDragging } = useSortable({ id });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    handleMenuClose();
    onDeleteTask(task!.id);
  };

  // Handle Escape key to close menu
  useEffect(() => {
    if (!open) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleMenuClose();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleEscape);
      // Cleanup
      return () => {
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [open]);

  // Cleanup menu state on unmount
  useEffect(() => {
    return () => {
      setAnchorEl(null);
    };
  }, []);


  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginBottom: '4px',
    opacity: dndIsDragging ? 0.5 : 1,
    cursor: dndIsDragging ? 'grabbing' : 'grab',
  };

  const getPriorityColor = getPriorityColorUtil;

  // Format date for display
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
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

  // Calculate completed/total subtasks
  const getSubtaskProgress = () => {
    if (!task?.subtasks || task.subtasks.length === 0) return null;
    const total = task.subtasks.length;
    const completed = task.subtasks.filter(
      (subtask) => subtask.status === 'Done'
    ).length;
    return { completed, total };
  };

  const subtaskProgress = getSubtaskProgress();

  // Get assignee avatars
  const getAssigneeAvatars = () => {
    if (!task?.assigneeInfo || task.assigneeInfo.length === 0) {
      return null;
    }
    const displayUsers = task.assigneeInfo.slice(0, 3);
    return (
      <Stack direction="row" className='task_user' spacing={0.5} sx={{ mt: '5px' }}>
        {displayUsers.map((user, index) => {
          const firstName = user.firstName || '';
          const lastName = user.lastName || '';
          const email = user.email || '';
          const initials = `${firstName[0] || ''}${lastName[0] || ''}`.trim() || (email ? email[0].toUpperCase() : '?');
          const displayName = `${firstName} ${lastName}`.trim() || email || 'Unknown';
          return (
            <Tooltip key={user._id || index} title={displayName}>
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  fontSize: '12px',
                  bgcolor: user.photoUrl ? 'transparent' : theme.palette.primary.main,
                  border: `1px solid ${theme.palette.divider}`,
                }}
                src={user.photoUrl}
                alt={initials}
              >
                {!user.photoUrl && initials}
              </Avatar>
            </Tooltip>
          );
        })}
        {task.assigneeInfo.length > 3 && (
          <Tooltip title={`+${task.assigneeInfo.length - 3} more`}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.primary.main, fontSize: '12px' }}>
              +{task.assigneeInfo.length - 3}
            </Avatar>
          </Tooltip>
        )}
      </Stack>
    );
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open edit if clicking on the menu button or its menu
    // Also don't open if this was a drag operation
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('[role="menuitem"]') ||
      (e.target as HTMLElement).closest('[role="menu"]') ||
      dndIsDragging || // If card is being dragged, don't open edit
      transform || // If card has transform (being dragged), don't open edit
      open // If menu is open, don't open edit
    ) {
      return;
    }
    if (task) {
      onEditTask(task);
    }
  };

  // Check if task is completed
  const taskStatus = (task?.status || '').toLowerCase();
  const isCompleted = taskStatus.includes('done') || taskStatus.includes('completed');
  
  // Check if task is due today and not completed
  const taskDueToday = !isCompleted && task?.dueDate && isDueToday(task.dueDate);

  return (
    <Card
      ref={setNodeRef}
      key={id}
      onClick={handleCardClick}
      style={style}
      {...attributes}
      {...listeners}
      sx={{
        mb: '0 !important',
        bgcolor: taskDueToday
          ? theme.palette.mode === 'dark'
            ? 'rgba(127, 29, 29, 0.3)' // Dark red background for dark mode
            : 'rgba(254, 242, 242, 0.8)' // Light red background for light mode
          : theme.palette.background.paper,
        border: `1px solid ${
          taskDueToday
            ? theme.palette.mode === 'dark'
              ? 'rgba(185, 28, 28, 0.4)' // Dark red border for dark mode
              : 'rgba(254, 202, 202, 0.5)' // Light red border for light mode
            : theme.palette.divider
        }`,
        borderRadius: '8px',
        padding: '16px',
        minHeight: 'auto',
        cursor: dndIsDragging ? 'grabbing' : 'grab',
        userSelect: 'none', // Prevent text selection during drag
        touchAction: 'none', // Prevent touch scrolling on mobile
        color: 'inherit',
        overflow: 'hidden', // Keep content inside card
        '&:hover': {
          boxShadow: dndIsDragging ? theme.shadows[8] : theme.shadows[4],
          borderColor: taskDueToday
            ? theme.palette.mode === 'dark'
              ? 'rgba(220, 38, 38, 0.5)' // Darker red border on hover for dark mode
              : 'rgba(254, 202, 202, 0.8)' // Light red border on hover for light mode
            : theme.palette.primary.main,
          bgcolor: taskDueToday
            ? theme.palette.mode === 'dark'
              ? 'rgba(153, 27, 27, 0.4)' // Slightly darker red on hover for dark mode
              : 'rgba(254, 226, 226, 0.9)' // Slightly darker red on hover for light mode
            : undefined,
        },
      }}
    >
      {task ? (
        <>
          <CardContent sx={{ p: '0 !important', overflow: 'visible' }}>
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
              {/* Checkmark icon - green filled when completed, gray outlined when not */}
              {(() => {
                const taskStatus = (task.status || '').toLowerCase();
                const isCompleted = taskStatus.includes('done') || taskStatus.includes('completed');
                return isCompleted ? (
                  <CheckCircle
                    sx={{
                      color: '#10b981',
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <CheckCircleOutline
                    sx={{
                      color: theme.palette.text.disabled,
                      fontSize: '20px',
                      flexShrink: 0,
                    }}
                  />
                );
              })()}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="body2"
                  fontWeight={500}
                  sx={{
                    mb: 0,
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? 'rgb(52 62 78 / 80%)'   // dark slate
                        : 'rgba(243, 244, 246, 0.8)',

                    padding: '6px',
                    borderRadius: '4px',
                    width: 'fit-content',

                    color:
                      theme.palette.mode === 'dark'
                        ? 'rgba(226, 232, 240, 1)' // light text
                        : theme.palette.text.primary,

                    lineHeight: 1.2,
                    fontSize: '13px',
                  }}
                >
                  {task.title}
                </Typography>
              </Box>
              <IconButton
                size="small"
                sx={{ p: 0.25, mt: -0.5, minWidth: '24px', width: '24px', height: '24px' }}
                onClick={handleMenuClick}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onPointerDown={(e) => {
                  e.stopPropagation(); // Prevent drag when clicking menu
                }}
              >
                <MoreVert fontSize="small" sx={{ color: theme.palette.text.secondary, fontSize: '16px' }} />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete();
                  }}
                >
                  <ListItemIcon>
                    <DeleteOutline fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Delete</ListItemText>
                </MenuItem>
              </Menu>
            </Stack>

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              <Chip
                label={getStatusDisplayName(task.status || 'Todo', task.projectId)}
                size="small"
                sx={{
                  fontWeight: 500,
                  minWidth: 'fit-content',
                  borderRadius: '4px',
                  fontSize: '12px',
                  bgcolor: getStatusColor(task.status || 'Todo', task.projectId).bg,
                  color: getStatusColor(task.status || 'Todo', task.projectId).text,
                  border: 'none',
                  '& .MuiChip-label': {
                    px: 0.75,
                    py: 0,
                  },
                }}
              />
              <Chip
                label={getPriorityDisplayName(task.priority || 'Medium', task.projectId)}
                size="small"
                sx={{
                  fontWeight: 500,
                  minWidth: 'fit-content',
                  borderRadius: '4px',
                  fontSize: '12px',
                  bgcolor: getPriorityColor(task.priority || 'Medium').bg,
                  color: getPriorityColor(task.priority || 'Medium').text,
                  border: 'none',
                  '& .MuiChip-label': {
                    px: 0.75,
                    py: 0,
                  },
                }}
              />
            </Stack>

            {/* Deadline, Subtasks, and Assignees Row */}
            <Stack
              sx={{
                mt: 0.75,
                flexWrap: 'wrap',
                gap: 0.75,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0, mt: 1 }}>
                {/* Deadline */}
                {task.dueDate && (
                  <Stack direction="row" alignItems="center" spacing={0.25} gap={0.25}>
                    <CalendarToday
                      sx={{
                        fontSize: '14px',
                        color: isDueToday(task.dueDate)
                          ? theme.palette.mode === 'dark'
                            ? '#f87171' // Lighter red for dark mode
                            : '#ef4444' // Red for light mode
                          : theme.palette.text.secondary,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '14px',
                        color: isDueToday(task.dueDate)
                          ? theme.palette.mode === 'dark'
                            ? '#f87171' // Lighter red for dark mode
                            : '#ef4444' // Red for light mode
                          : theme.palette.text.secondary,
                        fontWeight: isDueToday(task.dueDate) ? 600 : 400,
                      }}
                    >
                      {formatDate(task.dueDate)}
                    </Typography>
                  </Stack>
                )}

                {/* Subtask Progress */}
                {subtaskProgress && (
                  <Stack direction="row" alignItems="center" spacing={0.25} gap={0.25}>
                    <CheckBox sx={{ fontSize: '14px', color: theme.palette.text.secondary }} />
                    <Typography variant="caption" sx={{ fontSize: '14px', color: theme.palette.text.secondary }}>
                      {subtaskProgress.completed}/{subtaskProgress.total}
                    </Typography>
                  </Stack>
                )}
              </Box>
              {/* Assignee Avatars */}
              {getAssigneeAvatars()}
            </Stack>
          </CardContent>
        </>
      ) : (
        <Box
          sx={{
            minHeight: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            p: 3,
            bgcolor: 'transparent',
          }}
        >
          <Stack alignItems="center" spacing={1}>
            <InfoOutlined sx={{ color: theme.palette.text.disabled, fontSize: 24 }} />
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: '12px'
              }}
            >
              No items to display
            </Typography>
          </Stack>
        </Box>
      )}
    </Card>
  );
};
