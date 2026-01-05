import { ColumnAlignment } from '../projects/types';

export interface Role {
  id: number;
  roleName: string;
  permissions: string[];
  description: string;
}

export interface DeleteRoleProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  role: Role | null;
  handleDelete: () => void;
}

export interface RoleModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  role: Role | null;
  handleSaveRole: (role: Role) => void;
  availablePermissions: string[];
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
