'use client';

import React, { useEffect, useRef, useState } from 'react';
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
import { Close as CloseIcon, Add as AddIcon, DeleteOutline, ArrowBack, Print, PictureAsPdf, AddOutlined, Search } from '@mui/icons-material';
import InvoiceModal from './components/InvoiceModal';
import InvoiceItem from './components/InvoiceItem';
import PageHeader from '@/components/PageHeader';
import { Invoice } from './types';
import InvoiceTemplate from '@/components/invoices/InvoiceTemplate';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';

export default function InvoicesFeature() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { data: currentUser } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = currentUser?.role === 'Admin' || isSuperUser;

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [filter, setFilter] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<any | null>(null);
  const [selectedBanking, setSelectedBanking] = useState<any | null>(null);
  const [viewLoading, setViewLoading] = useState<boolean>(false);
  const [pdfGenerating, setPdfGenerating] = useState<boolean>(false);
  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const invoiceRef = useRef<HTMLDivElement | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
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

  const handleViewDetails = async (invoice: Invoice) => {
    const invoiceId = invoice._id || invoice.id;
    if (!invoiceId) return;

    try {
      setViewLoading(true);
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data?.success && response.data?.invoice) {
        const fullInvoice = response.data.invoice;
        setSelectedInvoice(fullInvoice);
        setSelectedCompany(fullInvoice.companyDetails || null);
        setSelectedBanking(fullInvoice.bankingDetails || null);
      } else {
        enqueueSnackbar({ message: 'Failed to load invoice', variant: 'error' });
      }
    } catch (error: any) {
      console.error('Error fetching invoice data:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to load invoice',
        variant: 'error',
      });
      setSelectedInvoice(null);
      setSelectedCompany(null);
      setSelectedBanking(null);
    } finally {
      setViewLoading(false);
    }
  };

  const handleCloseDialog = () => {
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

        // Immediately open the created invoice inside THIS page (no new tab / no navigation)
        if (response.data?.success && response.data?.invoice) {
          const created = response.data.invoice;
          setSelectedInvoice(created);
          setSelectedCompany(created.companyDetails || null);
          setSelectedBanking(created.bankingDetails || null);
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !selectedInvoice) return;

    setPdfGenerating(true);
    try {
      // Dynamic import so that Next.js export/prerender does not fail on server side
      const html2pdf = (await import('html2pdf.js')).default;
      const element = invoiceRef.current;
      const options = {
        margin: [10, 10, 10, 10],
        filename: `Invoice_${selectedInvoice.invoiceNumber || 'invoice'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
      };

      await html2pdf().set(options).from(element).save();
      enqueueSnackbar({ message: 'PDF downloaded successfully!', variant: 'success' });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      enqueueSnackbar({ message: 'Failed to generate PDF', variant: 'error' });
    } finally {
      setPdfGenerating(false);
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
                placeholder="Filter by project or status.."
                type="search"
                value={filter}
                onChange={handleFilterChange}
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
              {isAdmin && (
                <Button
                  variant="outlined"
                  startIcon={<AddOutlined />}
                  onClick={handleAddClick}
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
                  Add Invoice
                </Button>
              )}
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
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow
                sx={(theme) => ({
                  backgroundColor:
                    theme.palette.mode === 'dark'
                      ? '#111827'
                      : '#FAFBFD',
                  '& th': {
                    fontSize: 13,
                    fontWeight: 500,
                    color:
                      theme.palette.mode === 'dark'
                        ? '#9CA3AF'
                        : 'text.secondary',
                    borderBottom:
                      theme.palette.mode === 'dark'
                        ? '1px solid #1F2937'
                        : '1px solid #EDEFF3',
                  },
                })}
              >
                <TableCell>Invoice</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell align="left">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rectangular"/>
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="text" />
                    </TableCell>
                    <TableCell align="left">
                      <Skeleton variant="text" />
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

      {/* In-app Invoice Viewer (NO navigation, NO new tab) */}
      <Dialog
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        fullScreen
        PaperProps={{
          sx: {
            // Match standalone invoice page background so no dark dashboard strip shows through
            backgroundColor: '#f5f5f5',
            boxShadow: 'none',
            borderRadius: 0,
            m: 0,
          },
        }}
      >
        <Box sx={{ minHeight: '100vh', p: 2 }}>
          {/* Action bar */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
              p: 2,
              bgcolor: '#fff',
              borderRadius: 2,
              boxShadow: 1,
              maxWidth: 1160,
              mx: 'auto',
            }}
          >
            <Button startIcon={<ArrowBack />} onClick={() => setSelectedInvoice(null)} variant="outlined">
              Back
            </Button>
            <Stack direction="row" spacing={1}>
              <Button startIcon={<Print />} onClick={handlePrint} variant="outlined">
                Print
              </Button>
              <Button
                startIcon={pdfGenerating ? <Skeleton variant="circular" width={20} height={20} /> : <PictureAsPdf />}
                onClick={handleDownloadPDF}
                variant="contained"
                disabled={pdfGenerating}
              >
                {pdfGenerating ? 'Generating PDF...' : 'Download PDF'}
              </Button>
            </Stack>
          </Box>

          {/* Invoice content */}
          {viewLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Skeleton variant="rectangular" width={900} height={300} />
            </Box>
          ) : (
            <Box
              ref={invoiceRef}
              id="invoice-content"
              sx={{
                maxWidth: 1160,
                mx: 'auto',
                bgcolor: '#fff',
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.04)',
                boxShadow: '0px 4px 12px rgba(0,0,0,0.02)',
              }}
            >
              {selectedInvoice && (
                <InvoiceTemplate
                  company={
                    selectedCompany || {
                      companyName: '',
                      logoUrl: '',
                      address: '',
                      email: '',
                      phone: '',
                      taxNumber: '',
                      website: '',
                    }
                  }
                  invoice={selectedInvoice as any}
                  banking={
                    selectedBanking || {
                      accountHolder: '',
                      accountNumber: '',
                      bankName: '',
                      accountType: '',
                    }
                  }
                />
              )}
            </Box>
          )}
        </Box>
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
