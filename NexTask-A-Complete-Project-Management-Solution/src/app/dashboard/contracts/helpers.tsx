import { Chip } from '@mui/material';
import { Contract, ResponsiveTableColumn } from './types';

export const getContractStatusColor = (status: string) => {
  const statusLower = status?.toLowerCase() || '';
  switch (statusLower) {
    case 'active':
      return 'success';
    case 'pending':
      return 'warning';
    case 'completed':
      return 'primary';
    case 'draft':
      return 'default';
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
