import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogActions,
  Button,
} from '@mui/material';

export default function ResourceModal({
  open,
  setOpen,
  currentMember,
  setCurrentMember,
  handleSaveMember,
}) {
  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {currentMember && currentMember.id ? 'Edit Team Member' : 'Add New Team Member'}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Name"
          type="text"
          fullWidth
          value={currentMember?.name || ''}
          onChange={(e) => setCurrentMember({ ...currentMember!, name: e.target.value })}
        />
        <TextField
          margin="dense"
          label="Email"
          type="email"
          fullWidth
          value={currentMember?.email || ''}
          onChange={(e) => setCurrentMember({ ...currentMember!, email: e.target.value })}
        />
        <FormControl fullWidth margin="dense">
          <InputLabel>Role</InputLabel>
          <Select
            value={currentMember?.role || ''}
            onChange={(e) => setCurrentMember({ ...currentMember!, role: e.target.value })}
            label="Role"
          >
            <MenuItem value="Developer">Developer</MenuItem>
            <MenuItem value="Designer">Designer</MenuItem>
            <MenuItem value="Project Manager">Project Manager</MenuItem>
            <MenuItem value="Quality Assurance">Quality Assurance</MenuItem>
            <MenuItem value="QA Engineer">QA Engineer</MenuItem>
            <MenuItem value="Business Analyst">Business Analyst</MenuItem>
            <MenuItem value="DevOps Engineer">DevOps Engineer</MenuItem>
          </Select>
        </FormControl>
        <TextField
          margin="dense"
          label="Department"
          type="text"
          fullWidth
          value={currentMember?.department || ''}
          onChange={(e) =>
            setCurrentMember({
              ...currentMember!,
              department: e.target.value,
            })
          }
        />
        <TextField
          margin="dense"
          label="Join Date"
          type="date"
          fullWidth
          InputLabelProps={{ shrink: true }}
          value={currentMember?.joinDate || ''}
          onChange={(e) => setCurrentMember({ ...currentMember!, joinDate: e.target.value })}
        />
        <TextField
          margin="dense"
          label="Skills (comma-separated)"
          type="text"
          fullWidth
          value={currentMember?.skills.join(', ') || ''}
          onChange={(e) =>
            setCurrentMember({
              ...currentMember!,
              skills: e.target.value.split(',').map((s) => s.trim()),
            })
          }
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button onClick={handleSaveMember} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
