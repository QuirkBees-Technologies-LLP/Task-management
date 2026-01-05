'use client';

import React, { useEffect, useState } from 'react';
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
  ListItemText,
  ListItem,
  Skeleton,
} from '@mui/material';
import { Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import InvoiceModal from './components/InvoiceModal';
import InvoiceItem from './components/InvoiceItem';
import PageHeader from '@/components/PageHeader';
import { Invoice } from './types';
import { useData } from '@/utils/hooks';

export default function InvoicesFeature() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // Define the state types
  const { data: invoices, loading }: { data: Invoice[]; loading: boolean } = useData({
    key: 'invoices',
  });

  const [invoicesData, setInvoicesData] = useState<Invoice[]>(invoices);
  useEffect(() => setInvoicesData(invoices), [invoices]);

  const [filter, setFilter] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDialogOpen, setDialogOpen] = useState<boolean>(false);
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [invoiceForm, setInvoiceForm] = useState<Omit<Invoice, 'id'>>({
    invoiceNumber: '',
    project: '',
    amount: 0,
    status: 'Pending',
    dueDate: '',
  });

  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilter(event.target.value);
    const filteredInvoices = invoices.filter(
      (invoice) =>
        invoice.project.toLowerCase().includes(event.target.value.toLowerCase()) ||
        invoice.status.toLowerCase().includes(event.target.value.toLowerCase())
    );
    setInvoicesData(filteredInvoices);
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCloseDialog = () => {
    setSelectedInvoice(null);
    setDialogOpen(false);
  };

  const handleAddClick = () => {
    setInvoiceForm({
      invoiceNumber: `INV-${invoices.length + 1}`,
      project: '',
      amount: 0,
      status: 'Pending',
      dueDate: '',
    });
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditClick = (invoice: Invoice) => {
    setInvoiceForm(invoice);
    setIsEdit(true);
    setDialogOpen(true);
  };

  const handleSaveInvoice = () => {
    if (isEdit) {
      setInvoicesData((prevInvoices) =>
        prevInvoices.map((inv) =>
          Number(inv.id) === Number(invoiceForm.invoiceNumber) ? { ...inv, ...invoiceForm } : inv
        )
      );
    } else {
      const newInvoice: Invoice = { ...invoiceForm, id: invoices.length + 1 };
      setInvoicesData((prevInvoices) => [...prevInvoices, newInvoice]);
    }
    handleCloseDialog();
  };

  const handleStatusChange = (invoice: Invoice, newStatus: string | any) => {
    setInvoicesData((prevInvoices) =>
      prevInvoices.map((inv) => (inv.id === invoice.id ? { ...inv, status: newStatus } : inv))
    );
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

      {loading ? (
        Array.from({ length: 5 }).map((_, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={<Skeleton variant="text" width="80%" />}
              secondary={<Skeleton variant="text" width="60%" />}
            />
          </ListItem>
        ))
      ) : (
        <Box>
          {invoicesData.map((invoice) => (
            <InvoiceItem
              key={invoice.id}
              invoice={invoice}
              handleEditClick={handleEditClick}
              handleViewDetails={handleViewDetails}
              handleStatusChange={handleStatusChange}
            />
          ))}
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
      />

      {/* View Invoice Details Dialog */}
      <Dialog open={!!selectedInvoice} onClose={handleCloseDialog}>
        <DialogTitle>
          Invoice Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInvoice && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedInvoice.project} (#{selectedInvoice.invoiceNumber})
              </Typography>
              <Typography variant="body1">
                Amount: ${selectedInvoice.amount.toLocaleString()}
              </Typography>
              <Typography variant="body1">Status: {selectedInvoice.status}</Typography>
              <Typography variant="body1">Due Date: {selectedInvoice.dueDate}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
