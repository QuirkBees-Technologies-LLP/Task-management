'use client';
import React from 'react';
import { Check, Edit, Visibility, DeleteOutline, MoreVert } from '@mui/icons-material';
import { useState } from 'react';

import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
const getStatusDotColor = (status?: string) => {
  switch (status) {
    case 'Completed':
      return '#22C55E'; // green
    case 'Cancelled':
      return '#EF4444'; // red
    case 'Pending':
    default:
      return '#FF9800'; // orange
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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  return (
    <TableRow
      hover
      sx={(theme) => ({
        '& td': {
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1F2937' : '#EEF0F4'
            }`,
          fontSize: 13,
        },
        '&:hover': {
          backgroundColor:
            theme.palette.mode === 'dark' ? '#111827' : '#FAFBFF',
        },
      })}
    >
      {/* ================= INVOICE ================= */}
      <TableCell>
        <Stack direction="row" spacing={2} alignItems="center">
          {/* <Avatar
            sx={(theme) => ({
              width: 36,
              height: 36,
              bgcolor:
                theme.palette.mode === 'dark' ? '#1F2937' : '#F3F4F6',
              color:
                theme.palette.mode === 'dark' ? '#E5E7EB' : '#111827',
              fontWeight: 600,
            })}
          >
            {initial}
          </Avatar> */}

          <Avatar
            sx={(theme) => ({
              width: 38,
              height: 38,
              borderRadius: '8px',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? '#1F2937'
                  : '#F3F4F6',
              color:
                theme.palette.mode === 'dark'
                  ? '#E5E7EB'
                  : '#111827',
              fontWeight: 600,
              fontSize: 15,
            })}
          >
            {initial}
          </Avatar>

          <Box>
            <Typography fontWeight={500}>{displayName}</Typography>
            <Typography variant="caption" color="text.secondary">
              #{invoice.invoiceNumber || 'N/A'}
            </Typography>
          </Box>
        </Stack>
      </TableCell>

      {/* ================= AMOUNT ================= */}
      <TableCell>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: getStatusDotColor(invoice.status),
            }}
          />
          <Typography fontWeight={600}>
            {currencySymbol}
            {formattedAmount}
          </Typography>
        </Stack>
      </TableCell>

      {/* ================= STATUS ================= */}
      <TableCell>
        {(() => {
          const styles =
            invoice.status === 'Paid'
              ? {
                bg: 'rgba(34,197,94,0.15)',
                color: '#22C55E',
              }
              : invoice.status === 'Overdue'
                ? {
                  bg: 'rgba(239,68,68,0.15)',
                  color: '#FF3B3B',
                }
                : {
                  bg: 'rgba(255,165,0,0.15)',
                  color: '#FF9800',
                };

          return (
            <Chip
              label={invoice.status || 'Pending'}
              size="small"
              sx={{
                fontWeight: 500,
                minWidth: 'fit-content',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: styles.bg,
                color: styles.color,
              }}
            />
          );
        })()}
      </TableCell>

      {/* ================= DUE DATE ================= */}
      <TableCell>
        <Stack direction="row" spacing={1} alignItems="center">
          <CalendarTodayOutlinedIcon
            sx={{
              fontSize: 16,
              color: 'text.secondary',
            }}
          />
          <Typography variant="body2" color="text.secondary">
            {invoice.dueDate || 'N/A'}
          </Typography>
        </Stack>
      </TableCell>

      {/* ================= ACTIONS (DROPDOWN) ================= */}
      <TableCell align="left">
        <IconButton
          size="small"
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
            setSelectedInvoice(invoice);
          }}
        >
          <MoreVert fontSize="small" />
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl && selectedInvoice?._id === invoice._id)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
          <MenuItem onClick={() => handleViewDetails(invoice)}>
            View
          </MenuItem>

          <MenuItem
            onClick={() =>
              handleStatusChange(
                invoice,
                invoice.status === 'Completed' ? 'Pending' : 'Completed'
              )
            }
          >
            Mark as paid
          </MenuItem>

          <MenuItem onClick={() => handleEditClick(invoice)}>
            Edit
          </MenuItem>

          <MenuItem
            sx={{ color: 'error.main' }}
            onClick={() => handleDeleteClick(invoice)}
          >
            Delete
          </MenuItem>
        </Menu>
      </TableCell>
    </TableRow>
  );
}
