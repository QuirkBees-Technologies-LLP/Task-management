import React from 'react';
import {
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Divider,
  IconButton,
  Box,
  Stack,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getStatusStyles } from '../helpers';
import { ContractDetailsDialogProps } from '../types';

const ContractDetailsDialog: React.FC<ContractDetailsDialogProps> = ({
  open,
  onClose,
  contract,
}) => {
  if (!contract) return null;

  const displayClient = contract.clientName || contract.client || 'N/A';
  const displayValue = contract.value || contract.budget || 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{contract.title}</Typography>
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {contract.contractNumber && (
            <>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Contract Number
                </Typography>
                <Typography variant="body1">{contract.contractNumber}</Typography>
              </Box>
              <Divider />
            </>
          )}

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Client
            </Typography>
            <Typography variant="body1">{displayClient}</Typography>
          </Box>

          {contract.clientEmail && (
            <>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Client Email
                </Typography>
                <Typography variant="body1">{contract.clientEmail}</Typography>
              </Box>
              <Divider />
            </>
          )}

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Start Date
            </Typography>
            <Typography variant="body1">
              {contract.startDate ? new Date(contract.startDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              End Date
            </Typography>
            <Typography variant="body1">
              {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'N/A'}
            </Typography>
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Status
            </Typography>
            <Chip
              label={contract.status || 'N/A'}
              sx={{
                mt: 1,
                ...getStatusStyles(contract.status || ''),
                height: 24,
                fontWeight: 500,
                borderRadius: '4px',
                fontSize: '12px',
                minWidth: 'fit-content',
              }}
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Value
            </Typography>
            <Typography variant="body1">${displayValue.toLocaleString()}</Typography>
          </Box>

          {contract.description && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  {contract.description}
                </Typography>
              </Box>
            </>
          )}

          {contract.terms && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Terms
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {contract.terms}
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};

export default ContractDetailsDialog;
