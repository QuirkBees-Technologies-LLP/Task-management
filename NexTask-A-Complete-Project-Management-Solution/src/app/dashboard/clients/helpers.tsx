import { ClientListKeys, ResponsiveTableColumn } from './types';

const clientsColumns: ResponsiveTableColumn[] = [
  {
    title: 'Client Name',
    key: 'clientName',
  },
  { title: 'Project Name', key: 'projectName' },
  { title: 'Email', key: 'email' },
  { title: 'Phone', key: 'phone' },
  { title: 'Company', key: 'company' },
  { title: 'City', key: 'city' },
];

const clientListKeys: ClientListKeys = {
  primaryKeys: ['clientName'],
  secondaryKeys: ['email', 'phone', 'company', 'projectName'],
};

export { clientsColumns, clientListKeys };
