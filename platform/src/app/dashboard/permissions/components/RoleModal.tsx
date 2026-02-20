import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
  Divider,
} from '@mui/material';
import { DeleteRoleProps, Role, RoleModalProps } from '../types';

export const RoleModal: React.FC<RoleModalProps> = ({
  open,
  setOpen,
  role,
  handleSaveRole,
  availablePermissions,
  saving = false,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formValues, setFormValues] = useState<Partial<Role>>({
    roleName: '',
    permissions: [],
    description: '',
  });

  useEffect(() => {
    if (role && open) {
      setFormValues({
        roleName: role.roleName || '',
        permissions: role.permissions || [],
        description: role.description || '',
      });
    } else if (!role && open) {
      // Reset form for new role
      setFormValues({
        roleName: '',
        permissions: [],
        description: '',
      });
    }
  }, [role, open]);

  const handleChange = (field: keyof Role, value: string | string[]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const togglePermission = (permission: string) => {
    setFormValues((prev) => {
      const currentPermissions = prev.permissions || [];
      return {
        ...prev,
        permissions: currentPermissions.includes(permission)
          ? currentPermissions.filter((p) => p !== permission)
          : [...currentPermissions, permission],
      };
    });
  };

  const handleSelectAll = () => {
    const allSelected = (formValues.permissions || []).length === availablePermissions.length;
    setFormValues((prev) => ({
      ...prev,
      permissions: allSelected ? [] : [...availablePermissions],
    }));
  };

  const handleSave = () => {
    if (!formValues.roleName?.trim()) {
      return;
    }
    handleSaveRole(formValues);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const allSelected = (formValues.permissions || []).length === availablePermissions.length;
  const someSelected = (formValues.permissions || []).length > 0 && !allSelected;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      PaperProps={{ sx: { width: !isSmallScreen ? 500 : '100%', maxHeight: '90vh' } }}
      fullWidth={isSmallScreen}
    >
      <DialogTitle>{role ? 'Edit Role' : 'Add Role'}</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Role Name"
          fullWidth
          margin="normal"
          required
          value={formValues.roleName || ''}
          onChange={(e) => handleChange('roleName', e.target.value)}
        />
        <TextField
          label="Description"
          fullWidth
          margin="normal"
          multiline
          rows={2}
          value={formValues.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
        />
        {role && role.assignedUsers !== undefined && (
          <TextField
            label="Assigned Users"
            fullWidth
            margin="normal"
            value={`${role.assignedUsers || 0} user(s)`}
            InputProps={{
              readOnly: true,
            }}
            helperText="Number of users currently assigned to this role"
          />
        )}
        <Divider sx={{ my: 2 }} />
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 500 }}>Assign Permissions</Typography>
            <Button size="small" onClick={handleSelectAll}>
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
          </Box>
          <Box
            sx={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 1,
              p: 1,
            }}
          >
            <FormGroup>
              {availablePermissions.map((permission) => (
                <FormControlLabel
                  key={permission}
                  control={
                    <Checkbox
                      checked={(formValues.permissions || []).includes(permission)}
                      onChange={() => togglePermission(permission)}
                      indeterminate={someSelected && (formValues.permissions || []).includes(permission)}
                    />
                  }
                  label={permission}
                />
              ))}
            </FormGroup>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Selected: {(formValues.permissions || []).length} of {availablePermissions.length}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving || !formValues.roleName?.trim()}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const DeleteRole: React.FC<DeleteRoleProps> = ({
  open,
  setOpen,
  role,
  handleDelete,
  saving = false,
}) => {
  const roleName = role?.roleName || 'this role';
  const assignedUsers = role?.assignedUsers || 0;

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>Delete Role</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete the role <strong>{roleName}</strong>?
        </Typography>
        {assignedUsers > 0 && (
          <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
            Warning: This role is assigned to {assignedUsers} user(s). Deleting this role may affect user access.
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>
          {saving ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
