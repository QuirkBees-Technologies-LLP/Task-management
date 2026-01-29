import { Avatar, Stack, Typography } from '@mui/material';
import { Client, ClientListKeys, ResponsiveTableColumn } from './types';

const clientsColumns: ResponsiveTableColumn[] = [
  {
    title: 'Client',
    key: 'client',
    render: (client: Client) => {
      const fullName =
        client.clientName ||
        client.name ||
        '';
      const nameParts = fullName.trim().split(' ').filter(Boolean);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || fullName.charAt(0).toUpperCase() || '?';

      return (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar
            src={client.photoUrl || undefined}
            sx={{ width: 32, height: 32, fontSize: 14 }}
          >
            {(!client.photoUrl && initials) || undefined}
          </Avatar>
          <Stack spacing={0}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {fullName || '—'}
            </Typography>
            {client.email && (
              <Typography variant="caption" color="text.secondary">
                {client.email}
              </Typography>
            )}
          </Stack>
        </Stack>
      );
    },
  },
  {
    title: 'Project Name',
    key: 'projectName',
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
