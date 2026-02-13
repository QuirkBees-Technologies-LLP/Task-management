'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  pointerWithin,
  DragEndEvent,
  DragStartEvent,
  useDroppable,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Box,
  Paper,
  Typography,
  Stack,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  useTheme,
  useMediaQuery,
  Skeleton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add,
  MoreVert,
  Edit,
  Delete,
} from '@mui/icons-material';
import { SortableItem } from './SortableItem';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';
import { getSectionBackgroundColor } from '../utils/sectionColors';

interface TaskSection {
  _id: string;
  name: string;
  order: number;
  isDefault: boolean;
  projectId: string;
  tasks: Task[];
}

interface Task {
  _id?: string;
  title: string;
  description: string;
  status?: string; // Add status field to Task interface
  priority?: string;
  dueDate?: string;
  order: number;
  sectionId: string;
  attachments?: Array<{
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    attachmentType: 'file' | 'url' | 'google_drive' | 'onedrive' | 'box' | 'dropbox';
    uploadedAt?: string;
  }>;
  subtasks?: Array<{
    id: string;
    title: string;
    description?: string;
    status: 'Todo' | 'In Progress' | 'Done';
    dueDate?: string;
    attachments?: any[];
    createdAt?: string;
    updatedAt?: string;
  }>;
  assignee?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    photoUrl?: string;
  };
}

interface TaskBoardProps {
  projectId: string;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (sectionId: string) => void;
  refreshBoard?: () => void;
}

// Sortable Section Column Wrapper
const SortableSectionColumn: React.FC<{
  section: TaskSection;
  onEditSection: (section: TaskSection) => void;
  onDeleteSection: (section: TaskSection) => void;
  onAddTask: (sectionId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  canManageSections: boolean;
}> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `section::${props.section._id}`,
    disabled: !props.canManageSections,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Box ref={setNodeRef} style={style}>
      <TaskSectionColumn
        {...props}
        isDragging={isDragging}
        dragHandleProps={props.canManageSections ? { ...attributes, ...listeners } : undefined}
      />
    </Box>
  );
};

// Task Section Column Component
const TaskSectionColumn: React.FC<{
  section: TaskSection;
  onEditSection: (section: TaskSection) => void;
  onDeleteSection: (section: TaskSection) => void;
  onAddTask: (sectionId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  canManageSections: boolean;
  isDragging?: boolean;
  dragHandleProps?: any;
}> = ({
  section,
  onEditSection,
  onDeleteSection,
  onAddTask,
  onEditTask,
  onDeleteTask,
  canManageSections,
  isDragging = false,
  dragHandleProps,
}) => {
    const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id: section._id });
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [editingName, setEditingName] = useState(false);
    const [sectionName, setSectionName] = useState(section.name);

    useEffect(() => {
      setSectionName(section.name);
    }, [section.name]);

    // Close menu when clicking outside
    useEffect(() => {
      if (!anchorEl) return;

      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Element;
        if (!target.closest('[role="menu"]') &&
          !target.closest('[data-menu-button]')) {
          setAnchorEl(null);
        }
      };

      if (typeof document !== 'undefined') {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
          document.removeEventListener('mousedown', handleClickOutside);
        };
      }
    }, [anchorEl]);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
      setAnchorEl(null);
    };

    const handleRename = () => {
      handleMenuClose();
      setEditingName(true);
    };

    const handleSaveName = async () => {
      if (sectionName.trim() && sectionName !== section.name) {
        await onEditSection({ ...section, name: sectionName.trim() });
      } else {
        // Reset to original name if empty or unchanged
        setSectionName(section.name);
      }
      setEditingName(false);
    };

    const handleCancelEdit = () => {
      setSectionName(section.name);
      setEditingName(false);
    };

    const handleDelete = () => {
      handleMenuClose();
      onDeleteSection(section);
    };

    const taskIds = section.tasks
      .map((t, idx) => {
        // Ensure _id is a string (handle ObjectId objects)
        if (!t._id) {
          console.warn('Task missing _id at index', idx, 'in section', section._id);
          return null;
        }
        const taskId = String(t._id);
        const sectionId = section._id ? String(section._id) : '';
        return `${sectionId}::${taskId}::${idx}`;
      })
      .filter((id): id is string => id !== null && id !== undefined);

    // Get section background color based on section name and ID
    const sectionBgColor = getSectionBackgroundColor(section.name, section._id);

    return (
      <Paper
        sx={{
          minWidth: 388,
          maxWidth: 388,
          width: 388,
          height: 'calc(100vh - 180px)', // Full height columns
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0, // Prevent columns from shrinking
          bgcolor: sectionBgColor, // Section-specific background color
          border: (theme) => `1px solid ${isDragging ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: '8px',
          overflow: 'hidden', // Contain scrolling
          opacity: isDragging ? 0.5 : 1,
          transition: 'all 0.2s ease-in-out',
        }}
      >
        {/* Section Header */}
        <Box
          sx={{
            p: 1.5,
            bgcolor: sectionBgColor, // Match section background color
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            cursor: canManageSections && dragHandleProps ? 'grab' : 'default',
            '&:active': {
              cursor: canManageSections && dragHandleProps ? 'grabbing' : 'default',
            },
          }}
          {...dragHandleProps}
        >
          {editingName && canManageSections ? (
            <TextField
              value={sectionName}
              onChange={(e) => setSectionName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveName();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  handleCancelEdit();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              autoFocus
              size="small"
              fullWidth
              sx={{ flex: 1, mr: 1 }}
            />
          ) : (
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                fontSize: '14px',
                flex: 1,
                cursor: canManageSections ? (dragHandleProps ? 'grab' : 'pointer') : 'default',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                userSelect: 'none',
              }}
              onClick={canManageSections && !dragHandleProps ? handleRename : undefined}
              onDoubleClick={canManageSections && dragHandleProps ? handleRename : undefined}
            >
              <span>{section.name}</span>
              <span style={{ color: theme.palette.text.secondary, fontWeight: 400 }}>
                {section.tasks.length}
              </span>
            </Typography>
          )}
          {canManageSections && (
            <>
              <IconButton
                size="small"
                onClick={handleMenuClick}
                data-menu-button
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
              >
                <MoreVert fontSize="small" />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRename();
                  }}
                >
                  <ListItemIcon>
                    <Edit fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Rename</ListItemText>
                </MenuItem>
                {!section.isDefault && (
                  <MenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete();
                    }}
                  >
                    <ListItemIcon>
                      <Delete fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Delete</ListItemText>
                  </MenuItem>
                )}
              </Menu>
            </>
          )}
        </Box>

        {/* Tasks Container */}
        <Box
          ref={setDroppableRef}
          sx={{
            flex: '1 1 0',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            p: 2, // Increased padding to ensure rounded corners aren't clipped
            backgroundColor: isOver
              ? theme.palette.mode === 'dark'
                ? 'rgba(25, 118, 210, 0.15)' // More prominent blue tint in dark mode
                : 'rgba(25, 118, 210, 0.08)' // More prominent blue tint in light mode
              : sectionBgColor, // Use section background color
            border: isOver
              ? `2px dashed ${theme.palette.primary.main}`
              : `2px solid transparent`,
            boxShadow: isOver
              ? `0 0 0 2px ${theme.palette.primary.main}20, inset 0 0 20px ${theme.palette.primary.main}10`
              : 'none',
            transition: 'all 0.2s ease-in-out',
            position: 'relative',
            display: 'flex',
            justifyContent: 'space-between',
            flexDirection: 'column',
            borderRadius: '0',
            gap: 0.5, // Add gap between cards for better spacing
            '&::before': isOver ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 1,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.primary.main}15 100%)`,
              pointerEvents: 'none',
              zIndex: 0,
            } : {},
            '& .MuiCard-root': {
              minHeight: '65px',
              position: 'relative',
              zIndex: 1,
            },
            // Prevent scroll propagation to parent
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: theme.palette.divider,
              borderRadius: '4px',
              '&:hover': {
                background: theme.palette.text.secondary,
              },
            },
          }}
          onWheel={(e) => {
            // Stop scroll propagation when scrolling inside task section
            const element = e.currentTarget;
            const isScrollingDown = e.deltaY > 0;
            const isScrollingUp = e.deltaY < 0;
            const isAtTop = element.scrollTop === 0;
            const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;

            // Only stop propagation if we're not at the boundaries
            if ((isScrollingDown && !isAtBottom) || (isScrollingUp && !isAtTop)) {
              e.stopPropagation();
            }
          }}
        >
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            {section.tasks.length > 0 ? (
              <>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {section.tasks.map((task, index) => {
                    // Ensure IDs are strings
                    const taskId = task._id ? String(task._id) : `temp-${index}`;
                    const sectionId = section._id ? String(section._id) : '';
                    const sortableId = `${sectionId}::${taskId}::${index}`;

                    // Skip if task doesn't have a valid ID
                    if (!task._id) {
                      console.warn('Task missing _id:', task);
                      return null;
                    }

                    // Use actual task status if available, otherwise fall back to section name
                    // Convert API status format to frontend format
                    let taskStatus = (task as any).status || section.name;
                    if (taskStatus === 'pending') {
                      taskStatus = 'Todo';
                    } else if (taskStatus === 'in-progress') {
                      taskStatus = 'In Progress';
                    } else if (taskStatus === 'completed') {
                      taskStatus = 'Done';
                    }
                    return (
                      <SortableItem
                        key={sortableId}
                        id={sortableId}
                        item={{
                          id: taskId,
                          title: task.title,
                          description: task.description,
                          status: taskStatus,
                          priority: task.priority || 'Medium',
                          projectId: section.projectId,
                          dueDate: task.dueDate || '',
                          subtasks: task.subtasks || [],
                          assigneeInfo: (task as any).assigneeInfo || [],
                        }}
                        onEditTask={() => {
                          // Pass task with converted status to ensure it's available
                          const taskWithStatus = {
                            ...task,
                            status: taskStatus, // Use the converted status
                          };
                          onEditTask(taskWithStatus);
                        }}
                        onDeleteTask={() => onDeleteTask(taskId)}
                      />
                    );
                  })}
                </Box>
                {/* Add Task Button - right after tasks */}
                <Box sx={{ mt: 0.5, flexShrink: 0, px: 0.5 }}>
                  <Button
                    fullWidth
                    startIcon={<Add />}
                    onClick={() => onAddTask(section._id)}
                    size="small"
                    variant="text"
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark'
                        ? theme.palette.background.paper
                        : '#fff',

                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px',
                      padding: '16px',
                      textTransform: 'none',

                      color: theme.palette.text.secondary,
                      justifyContent: 'flex-start',

                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark'
                          ? theme.palette.action.hover
                          : theme.palette.action.hover,
                      },
                    }}
                  >
                    Add task
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Box
                  id={`${section._id}::empty`}
                  sx={{
                    textAlign: 'center',
                    py: 1.5,
                    color: 'text.secondary',
                    fontSize: '12px',
                    flex: '0 1 auto',
                  }}
                >

                </Box>
                {/* Add Task Button - after empty state */}
                <Box sx={{ mt: 0.5, flexShrink: 0, px: 0.5 }}>
                  <Button
                    fullWidth
                    startIcon={<Add />}
                    onClick={() => onAddTask(section._id)}
                    size="small"
                    variant="text"
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark'
                        ? theme.palette.background.paper
                        : '#fff',

                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: '8px',
                      padding: '16px',
                      textTransform: 'none',

                      color: theme.palette.text.secondary,
                      justifyContent: 'flex-start',

                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark'
                          ? theme.palette.action.hover
                          : theme.palette.action.hover,
                      },
                    }}
                  >
                    Add task
                  </Button>
                </Box>
              </>
            )}
          </SortableContext>
        </Box>
      </Paper>
    );
  };

const TaskBoard: React.FC<TaskBoardProps> = ({
  projectId,
  onEditTask,
  onDeleteTask,
  onAddTask,
  refreshBoard,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { data: userInfo } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const canManageSections = isSuperUser || userInfo?.role === 'Admin';
  const sensors = useSensors(
    // Make drag start feel immediate while still preventing accidental drags
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 2,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 80,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [sections, setSections] = useState<TaskSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeSection, setActiveSection] = useState<TaskSection | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<TaskSection | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [addSectionDialogOpen, setAddSectionDialogOpen] = useState(false);

  // Fetch task sections with tasks in a single optimized call
  const fetchTaskSections = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      // Use optimized board endpoint that returns sections with grouped tasks
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

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);

    // Check if it's a section drag (starts with "section::")
    if (activeId.startsWith('section::')) {
      const sectionId = activeId.replace('section::', '');
      const section = sections.find((s) => s._id === sectionId);
      if (section) {
        setActiveSection(section);
      }
    } else {
      // It's a task drag
      const parts = activeId.split('::');
      const taskId = parts[1];
      const section = sections.find((s) => s.tasks.some((t) => String(t._id) === taskId));
      if (section) {
        const task = section.tasks.find((t) => String(t._id) === taskId);
        if (task) setActiveTask(task);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    setActiveSection(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Check if it's a section drag
    if (activeId.startsWith('section::')) {
      const sourceSectionId = activeId.replace('section::', '');
      let targetSectionId: string;

      // Determine target section
      if (overId.startsWith('section::')) {
        targetSectionId = overId.replace('section::', '');
      } else {
        // Dropped on a task or section container, find the section
        if (sections.some((s) => String(s._id) === overId)) {
          targetSectionId = overId;
        } else {
          // Extract section from task ID format (sectionId::taskId::index)
          const parts = overId.split('::');
          targetSectionId = parts[0];
        }
      }

      if (sourceSectionId === targetSectionId) return;

      // Find source and target sections
      const sourceIndex = sections.findIndex((s) => String(s._id) === sourceSectionId);
      const targetIndex = sections.findIndex((s) => String(s._id) === targetSectionId);

      if (sourceIndex === -1 || targetIndex === -1) return;

      // Update UI optimistically
      const newSections = [...sections];
      const [movedSection] = newSections.splice(sourceIndex, 1);
      newSections.splice(targetIndex, 0, movedSection);

      // Update orders
      newSections.forEach((section, idx) => {
        section.order = idx;
      });

      setSections(newSections);

      // Persist to backend
      try {
        const token = safeLocalStorageGet(accessTokenKey);
        if (!token) return;

        // Update all sections' orders
        await Promise.all(
          newSections.map((section) =>
            axios.patch(
              `/api/sections/${section._id}`,
              { order: section.order },
              { headers: { Authorization: `Bearer ${token}` } }
            )
          )
        );
      } catch (error: any) {
        console.error('Error reordering sections:', error);
        enqueueSnackbar({
          message: error.response?.data?.error || 'Failed to reorder sections',
          variant: 'error',
        });
        // Revert on error
        fetchTaskSections();
      }
      return;
    }

    // It's a task drag (existing logic)
    // Parse active task info
    const activeParts = activeId.split('::');
    const activeSectionId = activeParts[0];
    const activeTaskId = activeParts[1];
    const activeIndex = parseInt(activeParts[2] || '0');

    // Find source section and task
    const sourceSection = sections.find((s) => s._id === activeSectionId);
    if (!sourceSection) return;

    const sourceTask = sourceSection.tasks[activeIndex];
    if (!sourceTask) return;

    // Determine target section and index
    let targetSectionId: string;
    let targetIndex: number;

    // Check if dropped on section container (the droppable Box)
    if (sections.some((s) => String(s._id) === overId)) {
      targetSectionId = overId;
      const targetSection = sections.find((s) => String(s._id) === targetSectionId);
      targetIndex = targetSection ? targetSection.tasks.length : 0;
    } else if (overId.endsWith('::empty')) {
      // Dropped on empty placeholder
      targetSectionId = overId.replace('::empty', '');
      targetIndex = 0;
    } else {
      // Dropped on another task
      const overParts = overId.split('::');
      targetSectionId = overParts[0];
      targetIndex = parseInt(overParts[2] || '0');
    }

    const targetSection = sections.find((s) => String(s._id) === targetSectionId);
    if (!targetSection) {
      console.warn('Target section not found:', targetSectionId);
      return;
    }

    // Update UI optimistically
    const newSections = [...sections];
    const sourceSectionIndex = newSections.findIndex((s) => String(s._id) === activeSectionId);
    const targetSectionIndex = newSections.findIndex((s) => String(s._id) === targetSectionId);

    if (sourceSectionIndex === -1 || targetSectionIndex === -1) {
      console.warn('Section indices not found:', { sourceSectionIndex, targetSectionIndex });
      return;
    }

    // Remove from source
    newSections[sourceSectionIndex].tasks = newSections[sourceSectionIndex].tasks.filter(
      (t) => String(t._id) !== activeTaskId
    );

    // Add to target
    const updatedTask = { ...sourceTask, sectionId: targetSectionId };
    newSections[targetSectionIndex].tasks.splice(targetIndex, 0, updatedTask);

    // Update orders
    newSections[targetSectionIndex].tasks.forEach((task, idx) => {
      task.order = idx;
    });

    setSections(newSections);

    // Persist to backend
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      await axios.patch(
        `/api/tasks/${activeTaskId}/move`,
        {
          sectionId: targetSectionId,
          order: targetIndex,
          projectId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error: any) {
      console.error('Error moving task:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to move task',
        variant: 'error',
      });
      // Revert on error
      fetchTaskSections();
    }
  };

  const handleEditSection = async (section: TaskSection) => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      await axios.patch(
        `/api/sections/${section._id}`,
        { name: section.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      enqueueSnackbar({ message: 'Task section renamed', variant: 'success' });
      fetchTaskSections();
    } catch (error: any) {
      console.error('Error renaming section:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to rename task section',
        variant: 'error',
      });
    }
  };

  const handleDeleteSection = (section: TaskSection) => {
    setSectionToDelete(section);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteSection = async () => {
    if (!sectionToDelete) return;

    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      await axios.delete(`/api/sections/${sectionToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      enqueueSnackbar({ message: 'Task section deleted', variant: 'success' });
      setDeleteDialogOpen(false);
      setSectionToDelete(null);
      fetchTaskSections();
    } catch (error: any) {
      console.error('Error deleting section:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete task section',
        variant: 'error',
      });
    }
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;

    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      await axios.post(
        `/api/projects/${projectId}/sections`,
        { name: newSectionName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      enqueueSnackbar({ message: 'Task section added', variant: 'success' });
      setAddSectionDialogOpen(false);
      setNewSectionName('');
      fetchTaskSections();
    } catch (error: any) {
      console.error('Error adding section:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to add task section',
        variant: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rectangular" width={388} height={775} sx={{ borderRadius: "8px" }} />
        ))}
      </Box>
    );
  }

  // Create sortable section IDs
  const sectionIds = sections.map((s) => `section::${s._id}`);

  return (
    <>
      <DndContext
        sensors={sensors}
        // Use pointer-based collision so the whole column reacts as a drop zone,
        // not just the area near the bottom or the centers of individual cards.
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sectionIds}
          strategy={horizontalListSortingStrategy}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              overflowY: 'hidden', // Prevent vertical scrolling on main container
              pb: 2,
              height: 'calc(100vh - 180px)',
              width: '100%',
              maxWidth: '100%',
              // Prevent horizontal scroll on page level
              position: 'relative',
              // Custom scrollbar styling
              '&::-webkit-scrollbar': {
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.divider,
                borderRadius: '4px',
                '&:hover': {
                  background: theme.palette.text.secondary,
                },
              },
            }}
          >
            {sections.map((section) => (
              <SortableSectionColumn
                key={section._id}
                section={section}
                onEditSection={handleEditSection}
                onDeleteSection={handleDeleteSection}
                onAddTask={onAddTask}
                onEditTask={onEditTask}
                onDeleteTask={onDeleteTask}
                canManageSections={canManageSections}
              />
            ))}

            {canManageSections && (
              <Paper
                sx={{
                  minWidth: 388,
                  maxWidth: 388,
                  width: 388,
                  height: 'calc(100vh - 180px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0, // Prevent from shrinking
                  border: (theme) => `2px dashed ${theme.palette.divider}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => setAddSectionDialogOpen(true)}
              >
                <Button startIcon={<Add />} variant="text" size="small">
                  Add Section
                </Button>
              </Paper>
            )}
          </Box>
        </SortableContext>

        <DragOverlay>
          {activeSection ? (
            <Paper
              sx={{
                p: 2,
                minWidth: 388,
                maxWidth: 388,
                width: 388,
                height: 'calc(100vh - 180px)',
                flexShrink: 0,
                boxShadow: 3,
                bgcolor: theme.palette.background.default,
                border: `1px solid ${theme.palette.primary.main}`,
                borderRadius: '8px',
              }}
            >
              <Typography variant="h6" sx={{ fontSize: '14px', fontWeight: 600 }}>
                {activeSection.name} {activeSection.tasks.length}
              </Typography>
            </Paper>
          ) : activeTask ? (
            <Paper
              sx={{
                p: 2,
                minWidth: 388,
                boxShadow: 3,
                bgcolor: theme.palette.background.default,
              }}
            >
              <Typography variant="subtitle2">{activeTask.title}</Typography>
            </Paper>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Delete Section Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Task Section</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the task section "{sectionToDelete?.name}"? This action cannot be undone.
            {sectionToDelete && sectionToDelete.tasks.length > 0 && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                This section contains {sectionToDelete.tasks.length} task(s). Please move them first.
              </Typography>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmDeleteSection}
            color="error"
            variant="contained"
            disabled={sectionToDelete?.tasks.length > 0}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Section Dialog */}
      <Dialog open={addSectionDialogOpen} onClose={() => setAddSectionDialogOpen(false)}>
        <DialogTitle>Add New Task Section</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Section Name"
            fullWidth
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSection();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddSectionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSection} variant="contained" disabled={!newSectionName.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default TaskBoard;
