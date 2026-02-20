'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Chip,
  ListItemIcon,
  ListItemText,
  useTheme,
  Divider,
} from '@mui/material';
import { Check, Edit } from '@mui/icons-material';
import { getStatusColor, getStatusOptions, getStatusDisplayName, getStatusFieldTitle } from '../utils/statusColors';
import EditStatusOptionsDialog from './EditStatusOptionsDialog';

interface StatusSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  size?: 'small' | 'medium';
  disabled?: boolean;
  projectId?: string;
}

const StatusSelect: React.FC<StatusSelectProps> = ({
  value,
  onChange,
  label,
  fullWidth = false,
  margin = 'dense',
  size = 'small',
  disabled = false,
  projectId,
}) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const selectRef = useRef<HTMLDivElement>(null);
  const [fieldTitle, setFieldTitle] = useState(label || getStatusFieldTitle(projectId));

  useEffect(() => {
    const handleOptionsUpdate = () => {
      setRefreshKey((prev) => prev + 1);
      // Update field title when options are updated
      setFieldTitle(label || getStatusFieldTitle(projectId));
    };

    window.addEventListener('statusOptionsUpdated', handleOptionsUpdate);
    return () => {
      window.removeEventListener('statusOptionsUpdated', handleOptionsUpdate);
    };
  }, [label, projectId]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  const handleEditOptions = () => {
    setOpen(false);
    setEditDialogOpen(true);
  };

  const handleSaveOptions = (options: Array<{ value: string; name: string; color: { bg: string; text: string } }>, fieldTitle: string, description: string) => {
    // Options are saved to localStorage in the dialog
    // Force re-render by dispatching event
    window.dispatchEvent(new Event('statusOptionsUpdated'));
  };

  const statusOptions = getStatusOptions(projectId);
  const selectedStatus = value || (statusOptions.length > 0 ? statusOptions[0].value : '');
  const selectedColors = getStatusColor(selectedStatus, projectId);
  const displayName = getStatusDisplayName(selectedStatus, projectId);

  return (
    <FormControl fullWidth={fullWidth} margin={margin} size={size} disabled={disabled}>
      <InputLabel id="status-select-label">{fieldTitle}</InputLabel>
      <Select
        labelId="status-select-label"
        id="status-select"
        value={value || (statusOptions.length > 0 ? statusOptions[0].value : '')}
        label={fieldTitle}
        onChange={handleChange}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        ref={selectRef}
        renderValue={(selected) => {
          const selectedColors = getStatusColor(selected, projectId);
          const displayName = getStatusDisplayName(selected, projectId);
          return (
            <Chip
              label={displayName}
              size="small"
              sx={{
                height: '24px',
                fontSize: '13px',
                fontWeight: 500,
                bgcolor: selectedColors.bg,
                color: selectedColors.text,
                border: 'none',
                '& .MuiChip-label': {
                  px: 1.5,
                },
              }}
            />
          );
        }}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            minHeight: size === 'small' ? '32px' : '40px',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: open ? theme.palette.primary.main : undefined,
          },
        }}
        MenuProps={{
          PaperProps: {
            sx: {
              mt: 0.5,
              minWidth: 200,
              '& .MuiMenuItem-root': {
                px: 1.5,
                py: 1,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
                '&.Mui-selected': {
                  bgcolor: theme.palette.action.selected,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                },
              },
            },
          },
        }}
      >
        <Divider sx={{ my: 0.5, mx: 0 }} />
        {statusOptions.map((statusOption) => {
          const statusColors = getStatusColor(statusOption.value, projectId);
          const isSelected = value === statusOption.value;
          const displayName = getStatusDisplayName(statusOption.value, projectId);
          
          return (
            <MenuItem key={statusOption.value} value={statusOption.value} selected={isSelected}>
              <ListItemIcon sx={{ minWidth: 36 }}>
                {isSelected && (
                  <Check
                    fontSize="small"
                    sx={{
                      color: theme.palette.text.primary,
                    }}
                  />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Chip
                    label={displayName}
                    size="small"
                    sx={{
                      height: '24px',
                      fontSize: '13px',
                      fontWeight: 500,
                      bgcolor: statusColors.bg,
                      color: statusColors.text,
                      border: 'none',
                      '& .MuiChip-label': {
                        px: 1.5,
                      },
                    }}
                  />
                }
              />
            </MenuItem>
          );
        })}
        <Divider sx={{ my: 0.5, mx: 0 }} />
        <MenuItem onClick={handleEditOptions}>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <Edit fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Edit options" />
        </MenuItem>
      </Select>
      <EditStatusOptionsDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveOptions}
        projectId={projectId}
      />
    </FormControl>
  );
};

export default StatusSelect;

