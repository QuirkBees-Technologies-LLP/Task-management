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

const taskColumns: ResponsiveTableColumn[] = [
  {
    title: 'ID',
    key: 'id',
  },
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
  { title: 'Due Date', key: 'dueDate' },
  { title: 'Priority', key: 'priority' },
];

const taskListKeys: ProjectListKeys = {
  primaryKeys: ['id', 'name', 'status'],
  secondaryKeys: ['startDate', 'endDate', 'description'],
};

export { taskStatusColor, taskColumns, taskListKeys };
