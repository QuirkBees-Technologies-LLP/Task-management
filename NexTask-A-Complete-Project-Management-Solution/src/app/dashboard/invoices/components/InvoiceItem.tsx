'use client';
import React from 'react';
import { Check, Edit, MoreVert, Visibility } from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Typography,
} from '@mui/material';

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
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
}) {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClickMore = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <ListItem component={Paper} sx={{ marginBottom: 2, padding: 2 }}>
      <ListItemText
        primary={
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {invoice.project} (#{invoice.invoiceNumber})
            </Typography>
            <IconButton onClick={handleClickMore}>
              <MoreVert />
            </IconButton>
          </Box>
        }
        secondary={
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body1" gutterBottom>
                Amount: ${invoice.amount.toLocaleString()}
              </Typography>
              <Chip
                label={invoice.status}
                color={getStatusColor(invoice.status)}
                sx={{ width: 80 }}
              />
            </Box>
            <Typography variant="body2">Due Date: {invoice.dueDate}</Typography>
          </Box>
        }
        secondaryTypographyProps={{
          component: 'div',
        }}
      />
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => handleViewDetails(invoice)}>
          <ListItemIcon>
            <Visibility />{' '}
          </ListItemIcon>
          View
        </MenuItem>
        <MenuItem onClick={() => handleEditClick(invoice)}>
          {' '}
          <ListItemIcon>
            <Edit />{' '}
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem
          onClick={() =>
            handleStatusChange(invoice, invoice.status === 'Paid' ? 'Pending' : 'Paid')
          }
        >
          <ListItemIcon>
            <Check />{' '}
          </ListItemIcon>
          Mark as {invoice.status === 'Paid' ? 'Pending' : 'Paid'}
        </MenuItem>
      </Menu>
    </ListItem>
  );
}
