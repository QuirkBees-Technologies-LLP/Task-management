import React from 'react';
import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Divider,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getContractStatusColor } from '../helpers';
import { ContractDetailsDialogProps } from '../types';

const ContractDetailsDialog: React.FC<ContractDetailsDialogProps> = ({
  open,
  onClose,
  contract,
}) => {
  if (!contract) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {contract.title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="subtitle1">Client: {contract.client}</Typography>
        <Divider sx={{ my: 2 }} />
        <Typography>Start Date: {new Date(contract.startDate).toLocaleDateString()}</Typography>
        <Typography>End Date: {new Date(contract.endDate).toLocaleDateString()}</Typography>
        <Chip
          label={contract.status}
          color={getContractStatusColor(contract.status)}
          sx={{ my: 2 }}
        />
        <Typography>Budget: ${contract.budget}</Typography>
        <Typography>Description: {contract.description}</Typography>
      </DialogContent>
    </Dialog>
  );
};

export default ContractDetailsDialog;
