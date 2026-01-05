import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
} from '@mui/material';
import { Client, ClientModalProps } from '../types';

export const ClientModal: React.FC<ClientModalProps> = ({
  open,
  setOpen,
  client,
  handleSaveClient,
}) => {
  const [formValues, setFormValues] = useState<Client>({
    id: client?.id || 0, // Default to 0 for new clients
    clientName: client?.clientName || '',
    contactPerson: client?.contactPerson || '',
    email: client?.email || '',
    projectsCount: client?.projectsCount || 0,
  });

  const handleChange = (field: keyof Client, value: string | number) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    handleSaveClient(formValues);
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>{client ? 'Edit Client' : 'Add Client'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Client Name"
          fullWidth
          margin="dense"
          value={formValues.clientName}
          onChange={(e) => handleChange('clientName', e.target.value)}
        />
        <TextField
          label="Contact Person"
          fullWidth
          margin="dense"
          value={formValues.contactPerson}
          onChange={(e) => handleChange('contactPerson', e.target.value)}
        />
        <TextField
          label="Email"
          fullWidth
          margin="dense"
          value={formValues.email}
          onChange={(e) => handleChange('email', e.target.value)}
        />
        <TextField
          label="Projects Count"
          type="number"
          fullWidth
          margin="dense"
          value={formValues.projectsCount}
          onChange={(e) => handleChange('projectsCount', Number(e.target.value))}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Props for DeleteClient
interface DeleteClientProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  client: Client | null;
  handleDelete: () => void;
}

export const DeleteClient: React.FC<DeleteClientProps> = ({
  open,
  setOpen,
  client,
  handleDelete,
}) => {
  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>Delete Client</DialogTitle>
      <DialogContent>
        {`Are you sure you want to delete ${client?.clientName || 'this client'}?`}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={handleDelete} color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};
