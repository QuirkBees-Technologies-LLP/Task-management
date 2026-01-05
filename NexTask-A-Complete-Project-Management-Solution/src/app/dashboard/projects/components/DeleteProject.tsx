import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

const ProjectDeleteDialog = ({
  open,
  onClose,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  onDelete: () => void;
}) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Delete Project</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Are you sure you want to delete this project? This action cannot be undone.
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onDelete} variant="contained" color="error" autoFocus>
        Delete
      </Button>
    </DialogActions>
  </Dialog>
);

export default ProjectDeleteDialog;
