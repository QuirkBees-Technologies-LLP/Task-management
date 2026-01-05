'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  useTheme,
  useMediaQuery,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
  Pagination,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon, DeleteOutline } from '@mui/icons-material';
import InvoiceModal from './components/InvoiceModal';
import InvoiceItem from './components/InvoiceItem';
import PageHeader from '@/components/PageHeader';
import { Invoice } from './types';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';

export default function InvoicesFeature() {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  
  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [invoiceForm, setInvoiceForm] = useState<Partial<Invoice>>({
    invoiceNumber: '',
    clientName: '',
    clientProject: '',
    clientEmail: '',
    amount: 0,
    currency: 'USD',
    status: 'Pending',
    dueDate: '',
    items: [],
    notes: '',
  });

  useEffect(() => {
    fetchInvoices();
  }, [page, filter]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(filter && { search: filter }),
      });

      const response = await axios.get(`/api/invoices?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const formattedInvoices = (response.data.invoices || []).map((inv: any) => ({
          ...inv,
          id: inv._id,
          project: inv.clientName || inv.project || '',
          dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '',
        }));
        setInvoices(formattedInvoices);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.totalPages || 1);
        }
      }
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch invoices',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const handleViewDetails = (invoice: Invoice) => {
    const invoiceId = invoice._id || invoice.id;
    if (invoiceId) {
      // Navigate to standalone invoice page (outside dashboard layout)
      router.push(`/invoices/${invoiceId}`);
    }
  };

  const handleCloseDialog = () => {
    setSelectedInvoice(null);
    setDialogOpen(false);
    setInvoiceForm({
      invoiceNumber: '',
      clientName: '',
      clientProject: '',
      clientEmail: '',
      amount: 0,
      currency: 'USD',
      status: 'Pending',
      dueDate: '',
      items: [],
      notes: '',
    });
  };

  const handleAddClick = () => {
    setInvoiceForm({
      invoiceNumber: `INV-${Date.now()}`,
      clientName: '',
      clientProject: '',
      clientEmail: '',
      amount: 0,
      currency: 'USD',
      status: 'Pending',
      dueDate: '',
      items: [],
      notes: '',
    });
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditClick = (invoice: Invoice) => {
    setInvoiceForm({
      ...invoice,
      clientName: invoice.clientName || invoice.project || '',
      currency: invoice.currency || 'USD',
    });
    setIsEdit(true);
    setDialogOpen(true);
  };

  const handleSaveInvoice = async () => {
    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const invoiceData = {
        invoiceNumber: invoiceForm.invoiceNumber,
        clientName: invoiceForm.clientName || invoiceForm.project,
        clientProject: invoiceForm.clientProject || '',
        clientEmail: invoiceForm.clientEmail || '',
        amount: parseFloat(String(invoiceForm.amount || 0)),
        currency: invoiceForm.currency || 'USD',
        dueDate: invoiceForm.dueDate || null,
        status: invoiceForm.status || 'Pending',
        items: invoiceForm.items || [],
        notes: invoiceForm.notes || '',
      };

      if (isEdit && invoiceForm._id) {
        // Update existing invoice
        await axios.patch(
          '/api/invoices',
          {
            invoiceId: invoiceForm._id,
            ...invoiceData,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        enqueueSnackbar({
          message: 'Invoice updated successfully!',
          variant: 'success',
        });
      } else {
        // Create new invoice
        const response = await axios.post('/api/invoices', invoiceData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        enqueueSnackbar({
          message: 'Invoice created successfully!',
          variant: 'success',
        });

        // Open invoice in new tab after creation
        if (response.data?.success && response.data?.invoice?._id) {
          const invoiceId = response.data.invoice._id;
          const invoiceUrl = `${window.location.origin}/invoices/${invoiceId}`;
          window.open(invoiceUrl, '_blank');
        }
      }

      handleCloseDialog();
      fetchInvoices();
    } catch (error: any) {
      console.error('Error saving invoice:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to save invoice',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (invoice: Invoice, newStatus: string) => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const invoiceId = invoice._id || invoice.id;
      if (!invoiceId) return;

      await axios.patch(
        '/api/invoices',
        {
          invoiceId: String(invoiceId),
          status: newStatus,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      enqueueSnackbar({
        message: 'Invoice status updated successfully!',
        variant: 'success',
      });

      fetchInvoices();
    } catch (error: any) {
      console.error('Error updating invoice status:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to update invoice status',
        variant: 'error',
      });
    }
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setInvoiceToDelete(invoice);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!invoiceToDelete) return;

    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const invoiceId = invoiceToDelete._id || invoiceToDelete.id;
      if (!invoiceId) return;

      await axios.delete(`/api/invoices?_id=${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      enqueueSnackbar({
        message: 'Invoice deleted successfully!',
        variant: 'success',
      });

      setDeleteDialogOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices();
    } catch (error: any) {
      console.error('Error deleting invoice:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete invoice',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Invoices"
        action={
          <Stack direction={'row'} spacing={2} alignItems={'center'} justifyContent={'center'}>
            {!isSmallScreen && (
              <TextField
                label="Filter by project or status"
                variant="outlined"
                margin="none"
                value={filter}
                onChange={handleFilterChange}
                size="small"
              />
            )}
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
              sx={{ mb: 2 }}
            >
              Add Invoice
            </Button>
          </Stack>
        }
      />

      {isSmallScreen && (
        <Box>
          <TextField
            fullWidth
            label="Filter by project or status"
            variant="standard"
            margin="normal"
            value={filter}
            onChange={handleFilterChange}
            size="small"
            sx={{ mb: 1.5 }}
          />
        </Box>
      )}

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
      {loading ? (
        Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton variant="text" width="60%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="40%" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular" width={80} height={28} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" width="50%" />
                    </TableCell>
                    <TableCell align="right">
                      <Skeleton variant="text" width="30%" />
                    </TableCell>
                  </TableRow>
        ))
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
              No invoices found
            </Typography>
                  </TableCell>
                </TableRow>
          ) : (
            invoices.map((invoice) => (
              <InvoiceItem
                key={invoice._id || invoice.id}
                invoice={invoice}
                handleEditClick={handleEditClick}
                handleViewDetails={handleViewDetails}
                handleStatusChange={handleStatusChange}
                handleDeleteClick={handleDeleteClick}
              />
            ))
          )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
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
      )}

      {/* Add/Edit Invoice Dialog */}
      <InvoiceModal
        isDialogOpen={isDialogOpen}
        handleCloseDialog={handleCloseDialog}
        isEdit={isEdit}
        invoiceForm={invoiceForm}
        setInvoiceForm={setInvoiceForm}
        handleSaveInvoice={handleSaveInvoice}
        saving={saving}
      />

      {/* View Invoice Details Dialog */}
      <Dialog open={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} fullWidth>
        <DialogTitle>
          Invoice Details
          <IconButton
            aria-label="close"
            onClick={() => setSelectedInvoice(null)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {(selectedInvoice.clientName || selectedInvoice.project) || 'N/A'} (#{selectedInvoice.invoiceNumber})
              </Typography>
              <Typography variant="body1">
                Amount: ${selectedInvoice.amount.toLocaleString()}
              </Typography>
              <Typography variant="body1">Status: {selectedInvoice.status}</Typography>
              <Typography variant="body1">
                Due Date: {selectedInvoice.dueDate || 'N/A'}
              </Typography>
              {selectedInvoice.clientEmail && (
                <Typography variant="body1">Client Email: {selectedInvoice.clientEmail}</Typography>
              )}
              {selectedInvoice.notes && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Notes: {selectedInvoice.notes}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedInvoice(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Invoice</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete invoice{' '}
            <strong>#{invoiceToDelete?.invoiceNumber}</strong>? This action cannot be undone.
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
