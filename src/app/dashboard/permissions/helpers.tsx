import { RoleListKeys, ResponsiveTableColumn, Role } from './types';

const rolesColumns: ResponsiveTableColumn[] = [
  {
    title: 'Role Name',
    key: 'roleName',
  },
  {
    title: 'Description',
    key: 'description',
    render: (role: Role) => <>{role.description || 'No description'}</>,
  },
  {
    title: 'Permissions',
    key: 'permissionsCount',
    align: 'center',
    render: (role: Role) => <>{role.permissionsCount || 0} permission(s)</>,
  },
  {
    title: 'Assigned Users',
    key: 'assignedUsers',
    align: 'center',
    render: (role: Role) => <>{role.assignedUsers || 0} user(s)</>,
  },
];

const roleListKeys: RoleListKeys = {
  primaryKeys: ['roleName'],
  secondaryKeys: ['description', 'permissionsCount', 'assignedUsers'],
};

export { rolesColumns, roleListKeys };
