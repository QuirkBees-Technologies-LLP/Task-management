'use client';
import React from 'react';
import { Check, Edit, Visibility, DeleteOutline } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'pending':
      return 'warning';
    case 'overdue':
      return 'error';
    default:
      return 'default';
  }
};

export default function InvoiceItem({
  invoice,
  handleEditClick,
  handleViewDetails,
  handleStatusChange,
  handleDeleteClick,
}) {
  const displayName = invoice.clientName || invoice.project || 'N/A';
  const initial = displayName?.[0]?.toUpperCase() || '#';
  const currentStatus = invoice.status?.toLowerCase() || 'pending';
  const isPaid = currentStatus === 'paid';
  const getCurrencySymbol = (code?: string) => {
    switch ((code || 'USD').toUpperCase()) {
      case 'USD':
        return '$';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      case 'INR':
        return '₹';
      case 'JPY':
        return '¥';
      default:
        return '$';
    }
  };
  const formattedAmount = Number(invoice.amount || 0).toLocaleString();
  const currencySymbol = getCurrencySymbol(invoice.currency);

  return (
    <TableRow hover>
      <TableCell>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar>{initial}</Avatar>
          <Box>
            <Typography variant="subtitle1">{displayName}</Typography>
            <Typography variant="body2" color="text.secondary">
              #{invoice.invoiceNumber || 'N/A'}
            </Typography>
          </Box>
        </Stack>
      </TableCell>
      <TableCell>
        <Typography fontWeight={600}>
          {currencySymbol}
          {formattedAmount}
        </Typography>
      </TableCell>
      <TableCell>
        <Chip label={invoice.status || 'Pending'} color={getStatusColor(invoice.status)} size="small" />
      </TableCell>
      <TableCell>
        <Typography variant="body2">{invoice.dueDate || 'N/A'}</Typography>
      </TableCell>
      <TableCell align="right">
        <Stack direction="row" spacing={1} justifyContent="flex-end">
          <IconButton aria-label="view invoice" size="small" onClick={() => handleViewDetails(invoice)}>
            <Visibility fontSize="small" />
          </IconButton>
          <Tooltip title={`Mark as ${isPaid ? 'Pending' : 'Paid'}`}>
            <IconButton
              aria-label={`mark as ${isPaid ? 'pending' : 'paid'}`}
              size="small"
              onClick={() => handleStatusChange(invoice, isPaid ? 'Pending' : 'Paid')}
            >
              <Check fontSize="small" color={isPaid ? 'warning' : 'success'} />
            </IconButton>
          </Tooltip>
          <IconButton aria-label="edit invoice" size="small" onClick={() => handleEditClick(invoice)}>
            <Edit fontSize="small" />
          </IconButton>
          {handleDeleteClick && (
            <IconButton
              aria-label="delete invoice"
              size="small"
              color="error"
              onClick={() => handleDeleteClick(invoice)}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );
}
