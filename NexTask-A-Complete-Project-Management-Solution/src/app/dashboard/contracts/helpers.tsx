import { Chip } from '@mui/material';
import { Contract, ResponsiveTableColumn } from './types';

export const getContractStatusColor = (status: string) => {
  switch (status) {
    case 'Active':
      return 'success';
    case 'Pending':
      return 'warning';
    case 'Completed':
      return 'primary';
    default:
      return 'default';
  }
};

export const contractColumns: ResponsiveTableColumn[] = [
  {
    title: 'Title',
    key: 'title',
  },
  {
    title: 'Client',
    key: 'client',
  },
  {
    title: 'Start Date',
    key: 'startDate',
  },
  {
    title: 'End Date',
    key: 'endDate',
  },
  {
    title: 'Status',
    key: 'status',
    align: 'center',
    render: ({ status }: Contract) => (
      <Chip label={status} color={getContractStatusColor(status!)} />
    ),
  },
  {
    title: 'Budget',
    key: 'budget',
  },
];
