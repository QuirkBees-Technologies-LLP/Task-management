import React, { useState } from 'react';
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
} from '@mui/material';
import { DeleteRoleProps, Role, RoleModalProps } from '../types';

export const RoleModal: React.FC<RoleModalProps> = ({
  open,
  setOpen,
  role,
  handleSaveRole,
  availablePermissions,
}) => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [formValues, setFormValues] = useState<Role>({
    id: role?.id || 0, // Default to 0 for new roles
    roleName: role?.roleName || '',
    permissions: role?.permissions || [],
    description: '',
  });

  const handleChange = (field: keyof Role, value: string | string[]) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const togglePermission = (permission: string) => {
    setFormValues((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions?.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSave = () => {
    handleSaveRole(formValues);
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{ sx: { width: !isSmallScreen ? 450 : '100%' } }}
      fullWidth={isSmallScreen}
    >
      <DialogTitle>{role ? 'Edit Role' : 'Add Role'}</DialogTitle>
      <DialogContent>
        <TextField
          label="Role Name"
          fullWidth
          margin="dense"
          value={formValues.roleName}
          onChange={(e) => handleChange('roleName', e.target.value)}
        />
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ fontSize: '1rem', mb: 1 }}>Assign Permissions</Typography>
          <FormGroup>
            {availablePermissions.map((permission) => (
              <FormControlLabel
                key={permission}
                control={
                  <Checkbox
                    checked={formValues.permissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                  />
                }
                label={permission}
              />
            ))}
          </FormGroup>
        </Box>
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

export const DeleteRole: React.FC<DeleteRoleProps> = ({ open, setOpen, role, handleDelete }) => {
  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>Delete Role</DialogTitle>
      <DialogContent>
        {`Are you sure you want to delete the role ${role?.roleName || 'this role'}?`}
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
