import { Chip, Typography } from '@mui/material';
import { ResponsiveTableColumn, Task } from './types';
import { ProjectListKeys } from '../projects/types';
import { truncateDescription } from '@/utils/constants';

// Function to determine status color
const taskStatusColor = (status: string): 'success' | 'warning' | 'default' => {
  switch (status) {
    case 'Done':
      return 'success';
    case 'In Progress':
      return 'warning';
    case 'Todo':
      return 'default';
    default:
      return 'default';
  }
};

// Function to format date properly
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return original if invalid date
    return date.toLocaleDateString('en-GB');
  } catch (error) {
    return dateString; // Return original string if parsing fails
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

const taskColumns: ResponsiveTableColumn[] = [
  { title: 'Task Name', key: 'title' },
  {
    title: 'Description',
    key: 'description',
    render: ({ description }) => <>{truncateDescription(description)}</>,
  },
  {
    title: 'Status',
    key: 'status',
    align: 'center',
    render: ({ status }: Task) => <Chip label={status} color={taskStatusColor(status!)} />,
  },
  {
    title: 'Due Date',
    key: 'dueDate',
    render: ({ dueDate }: Task) => (
      <Typography
        sx={(theme) => ({
          color: isDueToday(dueDate)
            ? theme.palette.mode === 'dark'
              ? '#f87171' // Lighter red for dark mode
              : '#ef4444' // Red for light mode
            : 'inherit',
          fontWeight: isDueToday(dueDate) ? 600 : 400,
        })}
      >
        {formatDate(dueDate)}
      </Typography>
    ),
  },
  { title: 'Priority', key: 'priority' },
];

const taskListKeys: ProjectListKeys = {
  primaryKeys: ['id', 'name', 'status'],
  secondaryKeys: ['startDate', 'endDate', 'description'],
};

export { taskStatusColor, taskColumns, taskListKeys };
