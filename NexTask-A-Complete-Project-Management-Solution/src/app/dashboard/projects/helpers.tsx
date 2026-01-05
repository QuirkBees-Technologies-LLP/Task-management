import { Chip, ChipProps, Link } from '@mui/material';
import NextLink from 'next/link';
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
  {
    title: 'ID',
    key: 'id',
    render: ({ id }) => (
      <Link component={NextLink} href={`/dashboard/projects/${id}`}>
        {id}
      </Link>
    ),
  },
  { title: 'Project Name', key: 'name' },
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
  primaryLinkKey: 'id',
  primaryKeys: ['name', 'status'],
  secondaryKeys: ['startDate', 'endDate', 'description'],
};

export { getProjectStatusColor, projectColumns, projectListKeys };
