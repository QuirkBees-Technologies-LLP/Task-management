'use client';
import React, { useEffect, useState } from 'react';
import { Button, Chip, Paper, Stack, useMediaQuery, useTheme, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from '@mui/material';
import { Add as AddIcon, Edit, DeleteOutline, Visibility } from '@mui/icons-material';
import ContractDetails from './components/ContractDetails';
import ContractForm from './components/ContractForm';
import PageHeader from '@/components/PageHeader';
import { Contract } from './types';
import ResponsiveTable from '@/components/Table';
import { contractColumns, getContractStatusColor } from './helpers';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';

export default function Contracts() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [selectedContract, setSelectedContract] = useState<Contract | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [contractToDelete, setContractToDelete] = useState<Contract | null>(null);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/contracts?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
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

  return (
    <>
      <PageHeader
        title="Contracts"
        action={
          <Button onClick={handleAddContract} variant="contained" color="primary" startIcon={<AddIcon />}>
            Add Contract
          </Button>
        }
      />

      <Paper sx={{ p: isSmallScreen ? 2 : 0 }}>
        <ResponsiveTable
          columns={contractColumns}
          data={contracts}
          loading={loading}
          listKeys={{
            primaryKeys: ['title'],
            secondaryKeys: ['client', 'startDate', 'endDate'],
          }}
          renderActions={(item: Contract) => (
            <Stack direction="row" spacing={1}>
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleViewContract(item)}
                title="View"
              >
                <Visibility fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="secondary"
                onClick={() => handleEditContract(item)}
                title="Edit"
              >
                <Edit fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDeleteContract(item)}
                title="Delete"
              >
                <DeleteOutline fontSize="small" />
              </IconButton>
              {isSmallScreen && (
                <Chip label={item.status} color={getContractStatusColor(item.status)} size="small" />
              )}
            </Stack>
          )}
        />
      </Paper>

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
