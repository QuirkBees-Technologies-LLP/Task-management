'use client';
import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { InvoiceDialogProps } from '../types';

export default function InvoiceDialog({
  isDialogOpen,
  handleCloseDialog,
  isEdit,
  invoiceForm,
  setInvoiceForm,
  handleSaveInvoice,
}: InvoiceDialogProps) {
  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setInvoiceForm((prevForm) => ({ ...prevForm, [name]: value }));
  };
  return (
    <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
      <DialogTitle>{isEdit ? 'Edit Invoice' : 'Add Invoice'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          margin="normal"
          label="Invoice Number"
          value={invoiceForm.invoiceNumber}
          fullWidth
          InputProps={{
            readOnly: true,
          }}
        />
        <TextField
          margin="normal"
          label="Project"
          name="project"
          value={invoiceForm.project}
          onChange={handleFormChange}
          fullWidth
        />
        <TextField
          margin="normal"
          label="Amount"
          name="amount"
          value={invoiceForm.amount}
          onChange={handleFormChange}
          type="number"
          fullWidth
        />
        <TextField
          margin="normal"
          label="Status"
          name="status"
          value={invoiceForm.status}
          onChange={handleFormChange}
          select
          fullWidth
        >
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Paid">Paid</MenuItem>
          <MenuItem value="Overdue">Overdue</MenuItem>
        </TextField>
        <TextField
          margin="normal"
          label="Due Date"
          name="dueDate"
          type="date"
          value={invoiceForm.dueDate}
          onChange={handleFormChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button onClick={handleSaveInvoice} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
