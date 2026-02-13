'use client';
import React, { useEffect, useState } from 'react';
import { Button, Chip, Paper, Stack, useMediaQuery, useTheme, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, TextField, Pagination } from '@mui/material';
import { Add as AddIcon, Edit, DeleteOutline, Visibility, Search, AddOutlined } from '@mui/icons-material';
import ContractDetails from './components/ContractDetails';
import ContractForm from './components/ContractForm';
import PageHeader from '@/components/PageHeader';
import { Contract } from './types';
import ResponsiveTable from '@/components/Table';
import { contractColumns } from './helpers';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Menu,
  MenuItem,
  ListItemIcon,
} from '@mui/material';

export default function Contracts() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedContract, setSelectedContract] = useState<Contract | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContracts();
  }, [page]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get(`/api/contracts?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setTotalPages(response.data.pagination?.totalPages || 1);
        const formattedContracts = (response.data.contracts || []).map((c: any) => ({
          ...c,
          id: c._id,
          client: c.clientName || c.client || '',
          budget: c.value || c.budget || 0,
          startDate: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
          endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
        }));
        setContracts(formattedContracts);
      }
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch contracts',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = () => {
    setSelectedContract(undefined);
    setIsFormOpen(true);
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setOpen(true);
  };

  const handleEditContract = (contract: Contract) => {
    setSelectedContract(contract);
    setIsFormOpen(true);
  };

  const handleDeleteContract = (contract: Contract) => {
    setContractToDelete(contract);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!contractToDelete) return;

    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const contractId = contractToDelete._id || contractToDelete.id;
      if (!contractId) return;

      await axios.delete(`/api/contracts?_id=${contractId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      enqueueSnackbar({
        message: 'Contract deleted successfully!',
        variant: 'success',
      });

      setDeleteDialogOpen(false);
      setContractToDelete(null);
      fetchContracts();
    } catch (error: any) {
      console.error('Error deleting contract:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete contract',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContract = async (contract: Partial<Contract>) => {
    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const contractData = {
        contractNumber: contract.contractNumber || `CNT-${Date.now()}`,
        title: contract.title || '',
        clientName: contract.clientName || contract.client || '',
        clientEmail: contract.clientEmail || '',
        startDate: contract.startDate || '',
        endDate: contract.endDate || null,
        value: parseFloat(String(contract.value || contract.budget || 0)),
        status: contract.status || 'draft',
        terms: contract.terms || '',
        description: contract.description || '',
      };

      if (selectedContract?._id || selectedContract?.id) {
        // Update existing contract
        const contractId = selectedContract._id || selectedContract.id;
        await axios.patch(
          '/api/contracts',
          {
            contractId: String(contractId),
            ...contractData,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        enqueueSnackbar({
          message: 'Contract updated successfully!',
          variant: 'success',
        });
      } else {
        // Create new contract
        await axios.post('/api/contracts', contractData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar({
          message: 'Contract created successfully!',
          variant: 'success',
        });
      }

      setIsFormOpen(false);
      setSelectedContract(undefined);
      fetchContracts();
    } catch (error: any) {
      console.error('Error saving contract:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to save contract',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<Contract | null>(null);

  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    item: Contract
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  return (
    <>
      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          padding: "16px 24px",
          borderRadius: "8px",
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
                placeholder="Search client.."
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
                onClick={handleAddContract}
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
                Add Contracts
              </Button>
            </Box>
          }
        />
      </Box>
      <Paper
        elevation={0}
        sx={(theme) => ({
          borderRadius: '8px',
          overflow: 'hidden',
          border: theme.palette.mode === 'dark'
            ? '1px solid #2A2F3A'
            : '1px solid #EDEFF3',
          backgroundColor: theme.palette.mode === 'dark'
            ? '#0F172A'
            : '#FFFFFF',
        })}
      >
        <ResponsiveTable
          columns={contractColumns}
          data={contracts}
          loading={loading}
          listKeys={{
            primaryKeys: ['title'],
            secondaryKeys: ['client', 'startDate', 'endDate'],
          }}
          renderActions={(item: Contract) => (
            <>
              <IconButton size="small" onClick={(e) => handleMenuOpen(e, item)}>
                <MoreVertIcon fontSize="small" />
              </IconButton>

              <Menu
                anchorEl={anchorEl}
                open={menuOpen && selectedItem?.id === item.id}
                onClose={handleMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                PaperProps={{
                  sx: (theme) => ({
                    borderRadius: '8px',
                    minWidth: 160,
                    bgcolor:
                      theme.palette.mode === 'dark'
                        ? '#111827'
                        : '#FFFFFF',
                    border: `1px solid ${theme.palette.mode === 'dark' ? '#1F2937' : '#E5E7EB'
                      }`,
                  }),
                }}
              >
                <MenuItem
                  onClick={() => {
                    handleViewContract(item);
                    handleMenuClose();
                  }}
                >
                  <Typography>View</Typography>
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    handleEditContract(item);
                    handleMenuClose();
                  }}
                >
                  <Typography>Edit</Typography>
                </MenuItem>

                <MenuItem
                  onClick={() => {
                    handleDeleteContract(item);
                    handleMenuClose();
                  }}
                  sx={{ color: 'error.main' }}
                >
                  <Typography>Delete</Typography>
                </MenuItem>
              </Menu>
            </>
          )}
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>

      <ContractDetails open={open} onClose={() => setOpen(false)} contract={selectedContract} />

      <ContractForm
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedContract(undefined);
        }}
        onSave={handleSaveContract}
        initialContract={selectedContract}
        saving={saving}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Contract</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete contract <strong>{contractToDelete?.title}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={saving}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
