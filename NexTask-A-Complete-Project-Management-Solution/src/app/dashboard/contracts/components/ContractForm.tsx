import React, { useState, ChangeEvent } from 'react';
import {
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
} from '@mui/material';
import { Contract, ContractFormProps } from '../types';

const ContractForm: React.FC<ContractFormProps> = ({ open, onClose, onSave, initialContract }) => {
  const [contract, setContract] = useState<Contract>(
    initialContract || {
      title: '',
      client: '',
      startDate: '',
      endDate: '',
      status: 'Pending',
      budget: 0,
      description: '',
    }
  );

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContract((prevContract) => ({ ...prevContract, [name]: value }));
  };

  const handleSubmit = () => {
    onSave(contract);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialContract ? 'Edit Contract' : 'Add Contract'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Title"
          name="title"
          value={contract.title}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Client"
          name="client"
          value={contract.client}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Start Date"
          name="startDate"
          type="date"
          value={contract.startDate}
          onChange={handleChange}
          fullWidth
          margin="normal"
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />
        <TextField
          label="End Date"
          name="endDate"
          type="date"
          value={contract.endDate}
          onChange={handleChange}
          fullWidth
          margin="normal"
          slotProps={{
            inputLabel: {
              shrink: true,
            },
          }}
        />
        <TextField
          label="Status"
          name="status"
          select
          value={contract.status}
          onChange={handleChange}
          fullWidth
          margin="normal"
        >
          <MenuItem value="Pending">Pending</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
        </TextField>
        <TextField
          label="Budget"
          name="budget"
          type="number"
          value={contract.budget}
          onChange={handleChange}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Description"
          name="description"
          value={contract.description}
          onChange={handleChange}
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractForm;
