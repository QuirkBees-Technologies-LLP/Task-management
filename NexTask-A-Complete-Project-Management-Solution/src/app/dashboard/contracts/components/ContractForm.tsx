import React, { useState, ChangeEvent, useEffect } from 'react';
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
} from '@mui/material';
import { enqueueSnackbar } from 'notistack';
import { Contract, ContractFormProps } from '../types';

const ContractForm: React.FC<ContractFormProps> = ({ open, onClose, onSave, initialContract, saving = false }) => {
  const [contract, setContract] = useState<Partial<Contract>>({
    contractNumber: '',
    title: '',
    clientName: '',
    client: '',
    clientEmail: '',
    startDate: '',
    endDate: '',
    status: 'draft',
    value: 0,
    budget: 0,
    description: '',
    terms: '',
  });
  const [endDateError, setEndDateError] = useState<string>('');
  const [endDateErrorTimeout, setEndDateErrorTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isPastDate, setIsPastDate] = useState<boolean>(false);

  useEffect(() => {
    if (initialContract) {
      setContract({
        contractNumber: initialContract.contractNumber || '',
        title: initialContract.title || '',
        clientName: initialContract.clientName || initialContract.client || '',
        client: initialContract.client || initialContract.clientName || '',
        clientEmail: initialContract.clientEmail || '',
        startDate: initialContract.startDate || '',
        endDate: initialContract.endDate || '',
        status: initialContract.status || 'draft',
        value: initialContract.value || initialContract.budget || 0,
        budget: initialContract.budget || initialContract.value || 0,
        description: initialContract.description || '',
        terms: initialContract.terms || '',
      });
    } else {
      setContract({
        contractNumber: `CNT-${Date.now()}`,
        title: '',
        clientName: '',
        client: '',
        clientEmail: '',
        startDate: '',
        endDate: '',
        status: 'draft',
        value: 0,
        budget: 0,
        description: '',
        terms: '',
      });
    }
  }, [initialContract, open]);

  // Helper function to validate date format (YYYY-MM-DD)
  const isValidDateFormat = (dateString: string): boolean => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;
    
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Check if date is valid (handles invalid dates like Feb 30)
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Validate end date - must be a future date
    if (name === 'endDate') {
      // ALWAYS update the form state first to prevent date/month from disappearing
      setContract((prevContract) => ({ ...prevContract, [name]: value }));

      // Clear any existing timeout
      if (endDateErrorTimeout) {
        clearTimeout(endDateErrorTimeout);
        setEndDateErrorTimeout(null);
      }

      // Only validate if date is complete (YYYY-MM-DD format = 10 characters)
      if (value && value.length === 10) {
        // First validate date format
        if (!isValidDateFormat(value)) {
          setEndDateError('Invalid date format. Please enter a valid date.');
          setIsPastDate(false);
          const timeout = setTimeout(() => setEndDateError(''), 2000);
          setEndDateErrorTimeout(timeout);
          return;
        }

        // Validate end date - must be a future date using normalized Date objects
        const [year, month, day] = value.split('-').map(Number);
        const selectedDate = new Date(year, month - 1, day);
        const today = new Date();
        
        // Normalize both dates to start of day for accurate comparison
        today.setHours(0, 0, 0, 0);
        selectedDate.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          setEndDateError('End date cannot be in the past. Please select a future date.');
          setIsPastDate(true);
          const timeout = setTimeout(() => {
            setEndDateError('');
            setIsPastDate(false);
          }, 2000);
          setEndDateErrorTimeout(timeout);
        } else {
          setEndDateError('');
          setIsPastDate(false);
        }
      } else if (value && value.length < 10) {
        // Date is incomplete, don't validate yet, just clear errors
        setEndDateError('');
        setIsPastDate(false);
      } else {
        // Empty value
        setEndDateError('');
        setIsPastDate(false);
      }
    } else {
      setContract((prevContract) => ({ ...prevContract, [name]: value }));
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (endDateErrorTimeout) {
        clearTimeout(endDateErrorTimeout);
      }
    };
  }, [endDateErrorTimeout]);

  const handleSubmit = () => {
    if (!isPastDate) {
    onSave(contract);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initialContract ? 'Edit Contract' : 'Add Contract'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Contract Number"
          name="contractNumber"
          value={contract.contractNumber || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputProps={{
            readOnly: true,
          }}
        />
        <TextField
          label="Title"
          name="title"
          value={contract.title || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Client Name"
          name="clientName"
          value={contract.clientName || contract.client || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          label="Client Email"
          name="clientEmail"
          type="email"
          value={contract.clientEmail || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Start Date"
          name="startDate"
          type="date"
          value={contract.startDate || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          InputLabelProps={{
            shrink: true,
          }}
        />
        <TextField
          label="End Date"
          name="endDate"
          type="date"
          value={contract.endDate || ''}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{
            shrink: true,
          }}
          inputProps={{
            min: new Date().toISOString().split('T')[0], // Set minimum date to today
          }}
          error={!!endDateError}
          helperText={endDateError || ''}
        />
        <TextField
          label="Status"
          name="status"
          select
          value={contract.status || 'draft'}
          onChange={handleChange}
          fullWidth
          margin="normal"
        >
          <MenuItem value="draft">Draft</MenuItem>
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
        </TextField>
        <TextField
          label="Value"
          name="value"
          type="number"
          value={contract.value || contract.budget || 0}
          onChange={handleChange}
          fullWidth
          margin="normal"
          inputProps={{ min: 0, step: 0.01 }}
        />
        <TextField
          label="Description"
          name="description"
          value={contract.description || ''}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          margin="normal"
        />
        <TextField
          label="Terms"
          name="terms"
          value={contract.terms || ''}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained" disabled={saving || isPastDate}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractForm;
