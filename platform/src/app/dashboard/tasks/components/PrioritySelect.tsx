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
import { getPriorityColor, PRIORITY_OPTIONS, PriorityValue, getPriorityDisplayName, getPriorityFieldTitle } from '../utils/priorityColors';
import EditPriorityOptionsDialog from './EditPriorityOptionsDialog';

interface PrioritySelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  fullWidth?: boolean;
  margin?: 'none' | 'dense' | 'normal';
  size?: 'small' | 'medium';
  disabled?: boolean;
  projectId?: string;
}

const PrioritySelect: React.FC<PrioritySelectProps> = ({
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
  const [fieldTitle, setFieldTitle] = useState(label || getPriorityFieldTitle(projectId));

  useEffect(() => {
    const handleOptionsUpdate = () => {
      setRefreshKey((prev) => prev + 1);
      // Update field title when options are updated
      setFieldTitle(label || getPriorityFieldTitle(projectId));
    };

    window.addEventListener('priorityOptionsUpdated', handleOptionsUpdate);
    return () => {
      window.removeEventListener('priorityOptionsUpdated', handleOptionsUpdate);
    };
  }, [label, projectId]);

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  const handleEditOptions = () => {
    setOpen(false);
    setEditDialogOpen(true);
  };

  const handleSaveOptions = (options: Record<PriorityValue, string>, fieldTitle: string, description: string) => {
    // Options are saved to localStorage in the dialog
    // Force re-render by dispatching event
    window.dispatchEvent(new Event('priorityOptionsUpdated'));
  };

  return (
    <FormControl fullWidth={fullWidth} margin={margin} size={size} disabled={disabled}>
      <InputLabel id="priority-select-label">{fieldTitle}</InputLabel>
      <Select
        labelId="priority-select-label"
        id="priority-select"
        value={value || 'Medium'}
        label={fieldTitle}
        onChange={handleChange}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        ref={selectRef}
        renderValue={(selected) => {
          const selectedPriority = selected as PriorityValue;
          const selectedColors = getPriorityColor(selectedPriority);
          const displayName = getPriorityDisplayName(selectedPriority, projectId);
          return (
            <Chip
              label={displayName}
              size="small"
              sx={{
                fontSize: '12px',
                fontWeight: 500,
                borderRadius: '4px',
                minWidth: 'fit-content',
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
        {PRIORITY_OPTIONS.map((priority) => {
          const priorityColors = getPriorityColor(priority);
          const isSelected = value === priority;
          const displayName = getPriorityDisplayName(priority, projectId);

          return (
            <MenuItem key={priority} value={priority} selected={isSelected}>
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
                      fontSize: '12px',
                      fontWeight: 500,
                      borderRadius: '4px',
                      minWidth: 'fit-content',
                      bgcolor: priorityColors.bg,
                      color: priorityColors.text,
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
      <EditPriorityOptionsDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleSaveOptions}
        projectId={projectId}
      />
    </FormControl>
  );
};

export default PrioritySelect;

