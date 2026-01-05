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
import { clients } from '@/utils/data';
import { clientListKeys, clientsColumns } from './helpers';
import { Client } from './types';
import { enqueueSnackbar } from 'notistack';
import { ClientModal, DeleteClient } from './components/ClientModal';

const ClientManagement: React.FC = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // State Management
  const [dataSource, setDataSource] = useState<Client[]>(clients);
  const [clientModalOpen, setClientModalOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
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

  const handleAddEditClient = (client: Client) => {
    if (selectedClient) {
      // Editing an existing client
      setDataSource((prev) => prev.map((item) => (item.id === client.id ? client : item)));
      enqueueSnackbar('Client edited successfully!', { variant: 'success' });
    } else {
      // Adding a new client
      setDataSource((prev) => [...prev, client]);
      enqueueSnackbar('Client added successfully!', { variant: 'success' });
    }
    setClientModalOpen(false);
    setSelectedClient(null);
  };

  const handleDeleteClient = () => {
    if (selectedClient) {
      setDataSource((prev) => prev.filter((client) => client.id !== selectedClient.id));
      enqueueSnackbar('Client deleted successfully!', { variant: 'success' });
    }
    setDeleteOpen(false);
    setSelectedClient(null);
  };

  const handleOpenEditModal = (client: Client) => {
    setSelectedClient(client);
    setClientModalOpen(true);
  };

  const handleOpenDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setDeleteOpen(true);
  };

  const renderActions = (item: Client) => {
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
        title="Client Management"
        action={
          <Button
            variant="contained"
            startIcon={<AddOutlined />}
            onClick={() => setClientModalOpen(true)}
          >
            Add Client
          </Button>
        }
        sx={{ pt: 0 }}
      />

      {/* Responsive Table */}
      <Paper sx={{ p: isSmallScreen ? 2 : 0 }}>
        <ResponsiveTable
          data={dataSource}
          columns={clientsColumns}
          listKeys={clientListKeys}
          renderActions={renderActions}
        />
      </Paper>

      {/* Add/Edit Client Modal */}
      <ClientModal
        open={clientModalOpen}
        setOpen={setClientModalOpen}
        client={selectedClient}
        handleSaveClient={handleAddEditClient}
      />

      {/* Delete Client Modal */}
      <DeleteClient
        open={deleteOpen}
        setOpen={setDeleteOpen}
        client={selectedClient}
        handleDelete={handleDeleteClient}
      />
    </>
  );
};

export default ClientManagement;
