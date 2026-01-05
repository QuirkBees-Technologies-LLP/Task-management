'use client';

import React, { useState, MouseEvent } from 'react';
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
import { roles } from '@/utils/data'; // Example data for roles
import { roleListKeys, rolesColumns } from './helpers'; // Helper for column definitions
import { Role } from './types'; // Role interface
import { enqueueSnackbar } from 'notistack';
import { RoleModal, DeleteRole } from './components/RoleModal';

const RolesManagement: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // State Management
  const [dataSource, setDataSource] = useState<Role[]>(roles);
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // Derived States
  const isMenuOpen = Boolean(menuAnchorEl);

  // Handlers
  const handleOpenMoreMenu = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleAddEditRole = (role: Role) => {
    if (selectedRole) {
      // Editing an existing role
      setDataSource((prev) => prev.map((item) => (item.id === role.id ? role : item)));
      enqueueSnackbar('Role edited successfully!', { variant: 'success' });
    } else {
      // Adding a new role
      setDataSource((prev) => [...prev, role]);
      enqueueSnackbar('Role added successfully!', { variant: 'success' });
    }
    setRoleModalOpen(false);
    setSelectedRole(null);
  };

  const handleDeleteRole = () => {
    if (selectedRole) {
      setDataSource((prev) => prev.filter((role) => role.id !== selectedRole.id));
      enqueueSnackbar('Role deleted successfully!', { variant: 'success' });
    }
    setDeleteOpen(false);
    setSelectedRole(null);
  };

  const handleOpenEditModal = (role: Role) => {
    setSelectedRole(role);
    setRoleModalOpen(true);
  };

  const handleOpenDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setDeleteOpen(true);
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
            <MenuItem
              onClick={() => {
                handleCloseMenu();
                handleOpenEditModal(item);
              }}
            >
              <ListItemIcon>
                <EditOutlined fontSize="small" />
              </ListItemIcon>
              <ListItemText>Edit</ListItemText>
            </MenuItem>
            <MenuItem
              onClick={() => {
                handleCloseMenu();
                handleOpenDeleteModal(item);
              }}
            >
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
          <DeleteOutline color="warning" />
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
            onClick={() => setRoleModalOpen(true)}
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
        />
      </Paper>

      {/* Add/Edit Role Modal */}
      <RoleModal
        open={roleModalOpen}
        setOpen={setRoleModalOpen}
        role={selectedRole}
        handleSaveRole={handleAddEditRole}
        availablePermissions={['View Reports', 'Manage Users', 'Delete Records']}
      />

      {/* Delete Role Modal */}
      <DeleteRole
        open={deleteOpen}
        setOpen={setDeleteOpen}
        role={selectedRole}
        handleDelete={handleDeleteRole}
      />
    </>
  );
};

export default RolesManagement;
