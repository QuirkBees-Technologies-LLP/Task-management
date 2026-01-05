import { Chip, ChipProps } from '@mui/material';
import { Project, ProjectListKeys, ProjectStatus, ResponsiveTableColumn } from './types'; // Adjust import path as necessary

const getProjectStatusColor = (status: ProjectStatus): ChipProps['color'] => {
  switch (status) {
    case 'Completed':
      return 'success';
    case 'In Progress':
      return 'warning';
    case 'Pending':
      return 'default';
    default:
      return 'default';
  }
};

const projectColumns: ResponsiveTableColumn[] = [
  { title: 'Project Name', key: 'name' },
  { title: 'Client Name', key: 'clientName' },
  { title: 'Description', key: 'description' },
  {
    title: 'Status',
    key: 'status',
    align: 'center',
    render: ({ status }: Project) => <Chip label={status} color={getProjectStatusColor(status!)} />,
  },
  { title: 'Start Date', key: 'startDate' },
  { title: 'End Date', key: 'endDate' },
];

const projectListKeys: ProjectListKeys = {
  primaryKeys: ['name', 'status'],
  secondaryKeys: ['clientName', 'startDate', 'endDate', 'description'],
};

export { getProjectStatusColor, projectColumns, projectListKeys };
