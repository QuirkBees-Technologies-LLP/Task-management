import { ColumnAlignment } from '../projects/types';

export interface Role {
  id?: number | string;
  _id?: string;
  roleName: string;
  permissions: string[];
  description?: string;
  assignedUsers?: number;
  permissionsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeleteRoleProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  role: Role | null;
  handleDelete: () => void;
  saving?: boolean;
}

export interface RoleModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  role: Role | null;
  handleSaveRole: (role: Partial<Role>) => void;
  availablePermissions: string[];
  saving?: boolean;
}

export interface ResponsiveTableColumn {
  title: string;
  key: string;
  align?: ColumnAlignment;
  render?: (data: Role) => JSX.Element;
}

export interface RoleListKeys {
  primaryLinkKey?: string;
  primaryKeys: string[];
  secondaryKeys: string[];
}
