'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar as BigCalendar, dateFnsLocalizer, Event } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import {
  Card,
  CardHeader,
  CardContent,
  Button,
  ButtonGroup,
  Stack,
  Typography,
  IconButton,
  useTheme,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { NavigateBefore, NavigateNext, Add } from '@mui/icons-material';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import TaskDialog from '../tasks/components/TaskModal';
import { Task } from '../tasks/types';
import { Project } from '../projects/types';
import { getPriorityColor } from '../tasks/utils/priorityColors';
import { getStatusColor } from '../tasks/utils/statusColors';

const locales = {
  'en-US': require('date-fns/locale/en-US'),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

interface CalendarEvent extends Event {
  title?: string;
  start?: Date;
  end?: Date;
  eventType?: 'task' | 'project' | 'calendar';
  taskId?: string;
  projectId?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  description?: string;
}

// Check if due date is today
const isDueToday = (date?: Date): boolean => {
  if (!date) return false;
  try {
    const today = new Date();
    const dueDate = new Date(date);
    
    if (isNaN(dueDate.getTime())) return false;
    
    // Normalize both dates to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return (
      today.getFullYear() === dueDate.getFullYear() &&
      today.getMonth() === dueDate.getMonth() &&
      today.getDate() === dueDate.getDate()
    );
  } catch {
    return false;
  }
};

// Check if task is completed
const isTaskCompleted = (status?: string): boolean => {
  if (!status) return false;
  const statusLower = status.toLowerCase();
  return statusLower.includes('done') || statusLower.includes('completed');
};

const Calendar = () => {
  const theme = useTheme();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [savingTask, setSavingTask] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = safeLocalStorageGet(accessTokenKey);
        if (!token) return;

        const response = await axios.get('/api/projects?limit=1000', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success) {
          // Convert projects from API format to expected format
          const convertedProjects: Project[] = (response.data.projects || []).map((p: any) => ({
            id: typeof p._id === 'string' ? p._id : String(p._id || ''),
            name: p.name || '',
            clientName: p.clientName || '',
            description: p.description || '',
            status: p.status || 'Pending',
            startDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
            endDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : '',
          }));
          setProjects(convertedProjects);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        enqueueSnackbar({
          message: 'Failed to fetch projects',
          variant: 'error',
        });
      }
    };
    fetchProjects();
  }, []);

  // Fetch calendar events and tasks
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      // Calculate date range based on current view
      let start: Date;
      let end: Date;

      if (view === 'month') {
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
      } else if (view === 'week') {
        start = startOfWeek(currentDate);
        end = new Date(start);
        end.setDate(end.getDate() + 6);
      } else {
        start = startOfDay(currentDate);
        end = endOfDay(currentDate);
      }

      const response = await axios.get(
        `/api/calendar?startDate=${start.toISOString()}&endDate=${end.toISOString()}&includeTasks=true`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        const calendarEvents: CalendarEvent[] = response.data.events.map((event: any) => {
          const startDate = new Date(event.startDate || event.start);
          const endDate = event.endDate ? new Date(event.endDate) : new Date(event.end || startDate);
          
          // Ensure all-day events span the full day
          if (event.allDay !== false) {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
          }

          return {
            title: event.title,
            start: startDate,
            end: endDate,
            allDay: event.allDay !== false,
            eventType: event.eventType || 'calendar',
            taskId: event.taskId || (event.eventType === 'task' ? event._id?.replace('task-', '') : undefined),
            projectId: event.projectId || (event.eventType === 'project' ? event._id?.replace('project-', '') : undefined),
            status: event.status,
            priority: event.priority,
            assignee: event.assignee,
            description: event.description,
            resource: event,
          };
        });

        console.log(`[Calendar] Loaded ${calendarEvents.length} events:`, {
          tasks: calendarEvents.filter(e => e.eventType === 'task').length,
          projects: calendarEvents.filter(e => e.eventType === 'project').length,
          calendar: calendarEvents.filter(e => e.eventType === 'calendar').length,
        });

        setEvents(calendarEvents);
      }
    } catch (error: any) {
      console.error('Error fetching calendar events:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch calendar events',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [currentDate, view, router]);

  // Fetch events when date or view changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents, refreshKey]);

  // Set up polling for real-time updates (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchEvents();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Listen for task updates from task module
  useEffect(() => {
    const handleTaskUpdate = () => {
      fetchEvents();
    };

    window.addEventListener('taskCreated', handleTaskUpdate);
    window.addEventListener('taskUpdated', handleTaskUpdate);
    window.addEventListener('taskDeleted', handleTaskUpdate);

    return () => {
      window.removeEventListener('taskCreated', handleTaskUpdate);
      window.removeEventListener('taskUpdated', handleTaskUpdate);
      window.removeEventListener('taskDeleted', handleTaskUpdate);
    };
  }, [fetchEvents]);

  const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      if (view === 'month') newDate.setMonth(newDate.getMonth() - 1);
      else if (view === 'week') newDate.setDate(newDate.getDate() - 7);
      else newDate.setDate(newDate.getDate() - 1);
    } else if (direction === 'next') {
      if (view === 'month') newDate.setMonth(newDate.getMonth() + 1);
      else if (view === 'week') newDate.setDate(newDate.getDate() + 7);
      else newDate.setDate(newDate.getDate() + 1);
    } else {
      newDate.setTime(Date.now());
    }
    setCurrentDate(newDate);
  };

  const handleSelectSlot = ({ start, end }: { start: Date; end: Date }) => {
    setSelectedSlot({ start, end });
    setEditingTask(null);
    setTaskDialogOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    if (event.eventType === 'task' && event.taskId) {
      // Open task edit dialog
      const task: Task = {
        id: event.taskId,
        title: event.title as string,
        description: event.description || '',
        status: event.status || 'Todo',
        priority: event.priority || 'Medium',
        projectId: event.projectId || '',
        dueDate: format(event.start, 'yyyy-MM-dd'),
        attachments: [],
        subtasks: [],
      };
      setEditingTask(task);
      setTaskDialogOpen(true);
    } else if (event.eventType === 'project' && event.projectId) {
      // Navigate to project details page
      router.push(`/projects/${event.projectId}/full-details`);
    } else {
      setSelectedEvent(event);
    }
  };

  const handleSaveTask = async (task: Task) => {
    if (savingTask) return;
    setSavingTask(true);

    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        setSavingTask(false);
        return;
      }

      // Ensure projectId is a string and validate
      const projectId = String(task.projectId || '').trim();
      if (!projectId || projectId === '0' || projectId === '') {
        enqueueSnackbar({ message: 'Please select a project', variant: 'error' });
        setSavingTask(false);
        return;
      }

      // Convert status to API format
      const apiStatus =
        task.status === 'Todo'
          ? 'pending'
          : task.status === 'In Progress'
            ? 'in-progress'
            : task.status === 'Done'
              ? 'completed'
              : task.status;

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

      if (task.id && task.id !== '0' && task.id !== 0) {
        // Update existing task
        await axios.patch(
          `/api/projects/${projectId}/tasks`,
          {
            taskId: String(task.id),
            title: task.title,
            description: task.description,
            status: apiStatus,
            priority: task.priority,
            dueDate: formattedDueDate,
            attachments: task.attachments || [],
            subtasks: task.subtasks || [],
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        enqueueSnackbar({ message: 'Task updated successfully', variant: 'success' });
      } else {
        // Create new task
        await axios.post(
          `/api/projects/${projectId}/tasks`,
          {
            title: task.title,
            description: task.description,
            status: apiStatus,
            priority: task.priority,
            dueDate: formattedDueDate,
            attachments: task.attachments || [],
            subtasks: task.subtasks || [],
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        enqueueSnackbar({ message: 'Task created successfully', variant: 'success' });
      }

      setTaskDialogOpen(false);
      setEditingTask(null);
      setSelectedSlot(null);
      setRefreshKey((prev) => prev + 1); // Trigger refresh
    } catch (error: any) {
      console.error('Error saving task:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to save task',
        variant: 'error',
      });
    } finally {
      setSavingTask(false);
    }
  };

  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false);
    setEditingTask(null);
    setSelectedSlot(null);
  };

  // Event styling based on type and priority
  const eventPropGetter = (event: CalendarEvent) => {
    if (event.eventType === 'task') {
      const priorityColor = getPriorityColor(event.priority || 'Medium');
      const statusColor = getStatusColor(event.status || 'Todo');
      
      // Check if task is due today and not completed
      const taskDueToday = isDueToday(event.start);
      const isCompleted = isTaskCompleted(event.status);
      const shouldHighlightRed = taskDueToday && !isCompleted;

      return {
        style: {
          backgroundColor: shouldHighlightRed
            ? theme.palette.mode === 'dark'
              ? 'rgba(127, 29, 29, 0.8)' // Dark red background for dark mode
              : 'rgba(254, 242, 242, 0.95)' // Light red background for light mode
            : priorityColor.bg,
          color: shouldHighlightRed
            ? theme.palette.mode === 'dark'
              ? '#f87171' // Lighter red text for dark mode
              : '#ef4444' // Red text for light mode
            : priorityColor.text,
          borderRadius: '6px',
          padding: '2px 6px',
          border: shouldHighlightRed
            ? theme.palette.mode === 'dark'
              ? '2px solid rgba(220, 38, 38, 0.8)' // Darker red border for dark mode
              : '2px solid rgba(254, 202, 202, 0.8)' // Light red border for light mode
            : `2px solid ${statusColor.bg}`,
          fontWeight: shouldHighlightRed ? 600 : 500,
          fontSize: '12px',
        },
      };
    }

    if (event.eventType === 'project') {
      // Style for project deadlines
      return {
        style: {
          backgroundColor: theme.palette.info.light || '#E3F2FD',
          color: theme.palette.info.dark || '#1976D2',
          borderRadius: '6px',
          padding: '2px 6px',
          border: `2px solid ${theme.palette.info.main || '#2196F3'}`,
          fontWeight: 500,
          fontSize: '12px',
        },
      };
    }

    return {
      style: {
        backgroundColor: theme.palette.primary.main,
        color: '#fff',
        borderRadius: '6px',
        padding: '2px 6px',
        border: 'none',
      },
    };
  };

  // Prepare task for dialog (use selected slot date if creating new)
  const taskForDialog = useMemo(() => {
    if (editingTask) {
      return editingTask;
    }

    if (selectedSlot) {
      const statusOptions = require('../tasks/utils/statusColors').getStatusOptions();
      const defaultStatus = statusOptions.length > 0 ? statusOptions[0].value : 'Todo';

      // Ensure projectId is a string
      const defaultProjectId = projects.length > 0 
        ? String(projects[0].id || '') 
        : '';

      return {
        id: '',
        title: '',
        description: '',
        status: defaultStatus,
        priority: 'Medium',
        projectId: defaultProjectId,
        dueDate: format(selectedSlot.start, 'yyyy-MM-dd'),
        attachments: [],
        subtasks: [],
      } as Task;
    }

    return null;
  }, [editingTask, selectedSlot, projects]);

  return (
    <>
      <Card
        sx={{
          bgcolor: theme.palette.background.paper,
          height: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Custom Header */}
        <CardHeader
          title={
            <Typography variant="h6" fontWeight="600">
              {view === 'month'
                ? format(currentDate, 'MMMM yyyy')
                : view === 'week'
                  ? `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
                  : format(currentDate, 'EEEE, MMM d, yyyy')}
            </Typography>
          }
          action={
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton onClick={() => handleNavigate('prev')} disabled={loading}>
                <NavigateBefore fontSize="small" color="secondary" />
              </IconButton>

              <Button
                variant="outlined"
                size="small"
                color="success"
                onClick={() => handleNavigate('today')}
                disabled={loading}
              >
                Today
              </Button>

              <IconButton onClick={() => handleNavigate('next')} disabled={loading}>
                <NavigateNext fontSize="small" color="secondary" />
              </IconButton>

              <ButtonGroup variant="outlined" size="small" sx={{ ml: 2 }}>
                <Button
                  onClick={() => setView('month')}
                  variant={view === 'month' ? 'contained' : 'outlined'}
                >
                  Month
                </Button>
                <Button
                  onClick={() => setView('week')}
                  variant={view === 'week' ? 'contained' : 'outlined'}
                >
                  Week
                </Button>
                <Button
                  onClick={() => setView('day')}
                  variant={view === 'day' ? 'contained' : 'outlined'}
                >
                  Day
                </Button>
              </ButtonGroup>

              <Button
                variant="contained"
                size="small"
                startIcon={<Add />}
                onClick={() => {
                  setSelectedSlot({ start: new Date(), end: new Date() });
                  setEditingTask(null);
                  setTaskDialogOpen(true);
                }}
                sx={{ ml: 2 }}
              >
                Add Task
              </Button>
            </Stack>
          }
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            p: 2,
          }}
        />

        {/* Calendar */}
        <CardContent sx={{ flex: 1, p: 2, position: 'relative' }}>
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1000,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <Box sx={{ position: 'relative', height: '100%' }}>
            <style>{`
              /* Ensure multiple events on same day are visible */
              .rbc-event {
                margin-bottom: 2px !important;
                min-height: 20px !important;
                overflow: visible !important;
              }
              .rbc-event-content {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .rbc-day-slot .rbc-events-container {
                margin-right: 0 !important;
              }
              .rbc-month-view .rbc-day-bg {
                position: relative;
              }
              .rbc-month-view .rbc-event {
                position: relative;
                margin: 1px 0;
                padding: 2px 4px;
                border-radius: 3px;
                font-size: 11px;
                line-height: 1.2;
              }
              .rbc-agenda-view .rbc-event {
                margin-bottom: 4px;
              }
            `}</style>
            <BigCalendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              date={currentDate}
              view={view}
              onView={(v) => setView(v as 'month' | 'week' | 'day')}
              onNavigate={(date) => setCurrentDate(date)}
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              selectable
              style={{
                height: '100%',
                borderRadius: 12,
                backgroundColor: theme.palette.background.default,
              }}
              eventPropGetter={eventPropGetter}
              tooltipAccessor={(event) => {
                const e = event as CalendarEvent;
                if (e.eventType === 'task') {
                  return `${e.title} - ${e.priority || 'Medium'} priority`;
                }
                if (e.eventType === 'project') {
                  return `${e.title} - Project Deadline`;
                }
                return e.title as string;
              }}
              components={{
                toolbar: () => null,
              }}
              popup
              popupOffset={{ x: 10, y: 10 }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Task Dialog */}
      {taskForDialog && (
        <TaskDialog
          open={taskDialogOpen}
          onClose={handleCloseTaskDialog}
          onSave={handleSaveTask}
          task={taskForDialog}
          projects={projects}
          saving={savingTask}
        />
      )}

      {/* Event Details Dialog (for calendar events) */}
      <Dialog open={!!selectedEvent && !taskDialogOpen} onClose={() => setSelectedEvent(null)} maxWidth="sm" fullWidth>
        {selectedEvent && (
          <>
            <DialogTitle>{selectedEvent.title}</DialogTitle>
            <DialogContent>
              {selectedEvent.description && (
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {selectedEvent.description}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary">
                Date: {format(selectedEvent.start, 'PPpp')}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedEvent(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default Calendar;
