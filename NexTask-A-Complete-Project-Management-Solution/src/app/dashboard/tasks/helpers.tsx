import { Chip } from '@mui/material';
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
    render: ({ dueDate }: Task) => <>{formatDate(dueDate)}</>,
  },
  { title: 'Priority', key: 'priority' },
];

const taskListKeys: ProjectListKeys = {
  primaryKeys: ['id', 'name', 'status'],
  secondaryKeys: ['startDate', 'endDate', 'description'],
};

export { taskStatusColor, taskColumns, taskListKeys };
