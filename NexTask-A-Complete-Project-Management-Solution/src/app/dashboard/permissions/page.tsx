'use client';

import React, { useState, useEffect, MouseEvent } from 'react';
import {
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AddOutlined, DeleteOutline, EditOutlined, MoreVert } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import ResponsiveTable from '@/components/Table';
import { roleListKeys, rolesColumns } from './helpers';
import { Role } from './types';
import { enqueueSnackbar } from 'notistack';
import { RoleModal, DeleteRole } from './components/RoleModal';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { useRouter } from 'next/navigation';

// Default available permissions list
const DEFAULT_PERMISSIONS = [
  'View Dashboard',
  'Manage Projects',
  'Manage Tasks',
  'Manage Users',
  'Manage Clients',
  'Manage Invoices',
  'Manage Contracts',
  'View Reports',
  'Manage Reports',
  'Manage Email Templates',
  'Manage Settings',
  'Manage Roles',
  'Delete Records',
  'Export Data',
  'Import Data',
];

const RolesManagement: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // State Management
  const [dataSource, setDataSource] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Derived States
  const isMenuOpen = Boolean(menuAnchorEl);

  useEffect(() => {
    const loadData = async () => {
      await fetchUsers();
    };
    loadData();
  }, []);

  useEffect(() => {
    if (users.length >= 0) {
      fetchRoles();
    }
  }, [users]);

  const fetchUsers = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/permissions', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Map roles and calculate assigned users count
        const convertedRoles: Role[] = (response.data.roles || []).map((r: any) => {
          const roleName = r.roleName || '';
          // Count users with this role
          const assignedUsersCount = users.filter((u: any) => u.role === roleName).length;

          return {
            ...r,
            id: r._id,
            permissions: r.permissions || [],
            description: r.description || '',
            permissionsCount: (r.permissions || []).length,
            assignedUsers: assignedUsersCount,
          };
        });

        setDataSource(convertedRoles);
      }
    } catch (error: any) {
      console.error('Error fetching roles:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch roles',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleOpenMoreMenu = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleAddEditRole = async (role: Partial<Role>) => {
    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const roleData = {
        roleName: role.roleName || '',
        permissions: role.permissions || [],
        description: role.description || '',
      };

      if (selectedRole?._id || selectedRole?.id) {
        // Update existing role
        const roleId = selectedRole._id || selectedRole.id;
        await axios.patch(
          '/api/permissions',
          {
            roleId: String(roleId),
            ...roleData,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        enqueueSnackbar({
          message: 'Role updated successfully!',
          variant: 'success',
        });
      } else {
        // Create new role
        await axios.post('/api/permissions', roleData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar({
          message: 'Role created successfully!',
          variant: 'success',
        });
      }

      setRoleModalOpen(false);
      setSelectedRole(null);
      await fetchRoles();
    } catch (error: any) {
      console.error('Error saving role:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to save role',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const roleId = selectedRole._id || selectedRole.id;
      if (!roleId) return;

      await axios.delete(`/api/permissions?_id=${roleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      enqueueSnackbar({
        message: 'Role deleted successfully!',
        variant: 'success',
      });

      setDeleteOpen(false);
      setSelectedRole(null);
      await fetchRoles();
    } catch (error: any) {
      console.error('Error deleting role:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete role',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (role: Role) => {
    setSelectedRole(role);
    setRoleModalOpen(true);
    handleCloseMenu();
  };

  const handleOpenDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setDeleteOpen(true);
    handleCloseMenu();
  };

  const handleOpenAddModal = () => {
    setSelectedRole(null);
    setRoleModalOpen(true);
  };

  const renderActions = (item: Role) => {
    if (isSmallScreen) {
      return (
        <>
          <IconButton onClick={handleOpenMoreMenu} size="small">
            <MoreVert fontSize="small" />
          </IconButton>
          <Menu
            anchorEl={menuAnchorEl}
            open={isMenuOpen}
            onClose={handleCloseMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
            transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <MenuItem onClick={() => handleOpenEditModal(item)}>
              <ListItemIcon>
                <EditOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => handleOpenDeleteModal(item)}>
              <ListItemIcon>
                <DeleteOutline fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </Menu>
        </>
      );
    }

    return (
      <Stack direction="row">
        <IconButton onClick={() => handleOpenEditModal(item)}>
          <EditOutlined color="primary" />
        </IconButton>
        <IconButton onClick={() => handleOpenDeleteModal(item)}>
          <DeleteOutline color="error" />
        </IconButton>
      </Stack>
    );
  };

  return (
    <>
      {/* Page Header */}
      <PageHeader
        title="Roles Management"
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={handleOpenAddModal}
          >
            Add Role
          </Button>
        }
        sx={{ pt: 0 }}
      />

      {/* Responsive Table */}
      <Paper sx={{ p: isSmallScreen ? 2 : 0 }}>
        <ResponsiveTable
          data={dataSource}
          columns={rolesColumns}
          listKeys={roleListKeys}
          renderActions={renderActions}
          loading={loading}
        />
      </Paper>

      {/* Add/Edit Role Modal */}
      <RoleModal
        open={roleModalOpen}
        setOpen={setRoleModalOpen}
        role={selectedRole}
        handleSaveRole={handleAddEditRole}
        availablePermissions={DEFAULT_PERMISSIONS}
        saving={saving}
      />

      {/* Delete Role Modal */}
      <DeleteRole
        open={deleteOpen}
        setOpen={setDeleteOpen}
        role={selectedRole}
        handleDelete={handleDeleteRole}
        saving={saving}
      />
    </>
  );
};

export default RolesManagement;
