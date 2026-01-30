'use client';

import React, { useState, useEffect, MouseEvent } from 'react';
import {
  Box,
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { AddOutlined, DeleteOutline, EditOutlined, MoreVert, Search } from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import ResponsiveTable from '@/components/Table';
import { clientListKeys, clientsColumns } from './helpers';
import { Client } from './types';
import { enqueueSnackbar } from 'notistack';
import { ClientModal, DeleteClient } from './components/ClientModal';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { useRouter } from 'next/navigation';

const ClientManagement: React.FC = () => {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // State Management
  const [dataSource, setDataSource] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [clientModalOpen, setClientModalOpen] = useState<boolean>(false);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  // Derived States
  const isMenuOpen = Boolean(menuAnchorEl);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/clients?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const convertedClients: Client[] = (response.data.clients || []).map((c: any) => ({
          ...c,
          id: c._id,
          clientName: c.name || c.clientName || '',
          projectName: c.projectName || '',
          projectsCount: c.projectsCount || 0,
        }));
        setDataSource(convertedClients);
      }
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch clients',
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

  const handleAddEditClient = async (client: Partial<Client>) => {
    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const clientData = {
        name: client.clientName || client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        address: client.address || '',
        city: client.city || '',
        country: client.country || '',
        notes: client.notes || '',
        projectName: client.projectName || '',
        photoUrl: client.photoUrl || '',
      };

      if (selectedClient?._id || selectedClient?.id) {
        // Update existing client
        const clientId = selectedClient._id || selectedClient.id;
        await axios.patch(
          '/api/clients',
          {
            clientId: String(clientId),
            ...clientData,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        enqueueSnackbar({
          message: 'Client updated successfully!',
          variant: 'success',
        });
      } else {
        // Create new client
        await axios.post('/api/clients', clientData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar({
          message: 'Client created successfully!',
          variant: 'success',
        });
      }

      setClientModalOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to save client',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const clientId = selectedClient._id || selectedClient.id;
      if (!clientId) return;

      await axios.delete(`/api/clients?_id=${clientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      enqueueSnackbar({
        message: 'Client deleted successfully!',
        variant: 'success',
      });

      setDeleteOpen(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error deleting client:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete client',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEditModal = (client: Client) => {
    setSelectedClient(client);
    setClientModalOpen(true);
    handleCloseMenu();
  };

  const handleOpenDeleteModal = (client: Client) => {
    setSelectedClient(client);
    setDeleteOpen(true);
    handleCloseMenu();
  };

  const handleOpenAddModal = () => {
    setSelectedClient(null);
    setClientModalOpen(true);
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
      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          padding: "16px 24px",
          borderRadius: "12px",
          mb: 3,
        }}
      >
        <PageHeader
          title="Projects"
          className="top_header"
          sx={{ mb: "0 !important" }}
          action={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                width: "100%",
                gap: 2,
              }}
            >
              {/* LEFT SIDE SEARCH BAR */}
              <TextField
                size="small"
                placeholder="Search clients.."
                type="search"
                InputProps={{
                  startAdornment: <Search fontSize="small" />,
                }}
                sx={{
                  width: { xs: "unset", lg: "520px" },
                  maxWidth: "100%",
                  borderRadius: "6px",

                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.background.default
                      : "#F9FAFC",

                  "& .MuiOutlinedInput-root": {
                    gap: 1,
                    color: (theme) => theme.palette.text.primary,

                    "& fieldset": {
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    },

                    "&:hover fieldset": {
                      borderColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? theme.palette.primary.main
                          : "#CBD5E1",
                    },
                  },
                }}
              />

              {/* RIGHT SIDE BUTTON */}
              <Button
                variant="outlined"
                startIcon={<AddOutlined />}
                onClick={handleOpenAddModal}
                sx={{
                  borderRadius: "6px",
                  fontWeight: 500,
                  color: (theme) =>
                    theme.palette.mode === "dark" ? "#fff" : "#000",

                  borderColor: (theme) =>
                    theme.palette.mode === "dark" ? "#fff" : "#000",

                  "&:hover": {
                    borderColor: (theme) =>
                      theme.palette.mode === "dark" ? "#fff" : "#000",

                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark"
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.04)",
                  },
                }}
              >
                Add Client
              </Button>
            </Box>
          }
        />
      </Box>
      {/* Responsive Table */}
      <Paper sx={{ p: isSmallScreen ? 2 : 0 }}>
        <ResponsiveTable
          data={dataSource}
          columns={clientsColumns}
          listKeys={clientListKeys}
          renderActions={renderActions}
          loading={loading}
        />
      </Paper>

      {/* Add/Edit Client Modal */}
      <ClientModal
        open={clientModalOpen}
        setOpen={setClientModalOpen}
        client={selectedClient}
        handleSaveClient={handleAddEditClient}
        saving={saving}
      />

      {/* Delete Client Modal */}
      <DeleteClient
        open={deleteOpen}
        setOpen={setDeleteOpen}
        client={selectedClient}
        handleDelete={handleDeleteClient}
        saving={saving}
      />
    </>
  );
};

export default ClientManagement;
