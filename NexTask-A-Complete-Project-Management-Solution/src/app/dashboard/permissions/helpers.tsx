import { RoleListKeys, ResponsiveTableColumn } from './types';

const rolesColumns: ResponsiveTableColumn[] = [
  {
    title: 'Role Name',
    key: 'roleName',
  },
  {
    title: 'Description',
    key: 'description',
  },
  {
    title: 'Assigned Users',
    key: 'assignedUsers',
    align: 'center',
  },
  {
    title: 'Permissions Count',
    key: 'permissionsCount',
    align: 'center',
  },
];

const roleListKeys: RoleListKeys = {
  primaryKeys: ['roleName'],
  secondaryKeys: ['description', 'permissionsCount', 'assignedUsers'],
};

export { rolesColumns, roleListKeys };
