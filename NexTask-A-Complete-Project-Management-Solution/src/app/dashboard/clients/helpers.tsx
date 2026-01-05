import { ClientListKeys, ResponsiveTableColumn } from './types';

const clientsColumns: ResponsiveTableColumn[] = [
  {
    title: 'Client Name',
    key: 'clientName',
  },
  { title: 'Contact Person', key: 'contactPerson' },
  { title: 'Email', key: 'email' },
  {
    title: 'Project Count',
    key: 'projectsCount',
    align: 'center',
  },
];

const clientListKeys: ClientListKeys = {
  primaryKeys: ['clientName'],
  secondaryKeys: ['email', 'projectsCount', 'contactPerson'],
};

export { clientsColumns, clientListKeys };
