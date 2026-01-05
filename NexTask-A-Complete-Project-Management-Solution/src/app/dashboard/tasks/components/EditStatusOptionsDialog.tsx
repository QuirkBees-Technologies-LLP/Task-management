'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Box,
  IconButton,
  Typography,
  Chip,
  Divider,
  Grid,
} from '@mui/material';
import { Close, Delete } from '@mui/icons-material';
import { getStatusColor, getStatusOptions, STATUS_COLORS_EXTENDED } from '../utils/statusColors';

interface StatusOption {
  id: string;
  value: string;
  name: string;
  color: { bg: string; text: string };
}

interface EditStatusOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (options: Array<{ value: string; name: string; color: { bg: string; text: string } }>, fieldTitle: string, description: string) => void;
  projectId?: string;
}

const EditStatusOptionsDialog: React.FC<EditStatusOptionsDialogProps> = ({
  open,
  onClose,
  onSave,
  projectId,
}) => {
  const [fieldTitle, setFieldTitle] = useState('Status');
  const [description, setDescription] = useState('Track the status of each task.');
  const [options, setOptions] = useState<StatusOption[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [showNewOptionField, setShowNewOptionField] = useState(false);

  useEffect(() => {
    if (open) {
      // Load saved options from localStorage (project-specific if projectId provided)
      const statusOptionsKey = projectId ? `statusOptions_${projectId}` : 'statusOptions';
      const fieldTitleKey = projectId ? `statusFieldTitle_${projectId}` : 'statusFieldTitle';
      const descriptionKey = projectId ? `statusFieldDescription_${projectId}` : 'statusFieldDescription';
      
      const savedOptions = localStorage.getItem(statusOptionsKey);
      const savedFieldTitle = localStorage.getItem(fieldTitleKey);
      const savedDescription = localStorage.getItem(descriptionKey);
      
      if (savedFieldTitle) {
        setFieldTitle(savedFieldTitle);
      }
      if (savedDescription) {
        setDescription(savedDescription);
      }

      if (savedOptions) {
        try {
          const parsed = JSON.parse(savedOptions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOptions(parsed.map((opt: any, index: number) => ({
              id: opt.id || `option-${index}`,
              value: opt.value,
              name: opt.name || opt.value,
              color: opt.color || STATUS_COLORS_EXTENDED[index % STATUS_COLORS_EXTENDED.length],
            })));
          } else {
            // Fallback to default
            const defaultOptions: StatusOption[] = ['Todo', 'In Progress', 'Done'].map((value, index) => ({
              id: `option-${index}`,
              value,
              name: value,
              color: STATUS_COLORS_EXTENDED[index % STATUS_COLORS_EXTENDED.length],
            }));
            setOptions(defaultOptions);
          }
        } catch (e) {
          console.error('Error loading status options:', e);
          // Fallback to default
          const defaultOptions: StatusOption[] = ['Todo', 'In Progress', 'Done'].map((value, index) => ({
            id: `option-${index}`,
            value,
            name: value,
            color: STATUS_COLORS_EXTENDED[index % STATUS_COLORS_EXTENDED.length],
          }));
          setOptions(defaultOptions);
        }
      } else {
        // Default options
        const defaultOptions: StatusOption[] = ['Todo', 'In Progress', 'Done'].map((value, index) => ({
          id: `option-${index}`,
          value,
          name: value,
          color: STATUS_COLORS_EXTENDED[index % STATUS_COLORS_EXTENDED.length],
        }));
        setOptions(defaultOptions);
      }
      
      // Reset new option field state
      setShowNewOptionField(false);
      setNewOptionName('');
    }
  }, [open]);

  const handleOptionChange = (id: string, value: string) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, name: value } : opt))
    );
  };

  const handleDeleteOption = (id: string) => {
    setOptions((prev) => prev.filter((opt) => opt.id !== id));
  };

  const handleShowNewOptionField = () => {
    setShowNewOptionField(true);
  };

  const handleAddOption = () => {
    if (!newOptionName.trim()) return;

    // Generate unique colors for new options (avoid repeating colors)
    const usedColors = options.map(opt => `${opt.color.bg}-${opt.color.text}`);
    
    // Find first unused color from extended palette
    let selectedColor = STATUS_COLORS_EXTENDED[0];
    for (const color of STATUS_COLORS_EXTENDED) {
      const colorKey = `${color.bg}-${color.text}`;
      if (!usedColors.includes(colorKey)) {
        selectedColor = color;
        break;
      }
    }

    // If all base colors are used, generate a random color
    if (usedColors.includes(`${selectedColor.bg}-${selectedColor.text}`)) {
      const hue = (options.length * 137.508) % 360; // Golden angle for color distribution
      const saturation = 30 + (options.length % 20);
      const lightness = 85 + (options.length % 10);
      selectedColor = {
        bg: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
        text: `hsl(${hue}, ${saturation + 40}%, ${lightness - 50}%)`,
      };
    }

    const newOption: StatusOption = {
      id: `option-${Date.now()}`,
      value: newOptionName.trim(),
      name: newOptionName.trim(),
      color: selectedColor,
    };

    setOptions((prev) => [...prev, newOption]);
    setNewOptionName('');
    setShowNewOptionField(false);
  };

  const handleCancelNewOption = () => {
    setNewOptionName('');
    setShowNewOptionField(false);
  };

  const handleSave = () => {
    // Convert options array to format for localStorage
    const optionsToSave = options.map(opt => ({
      id: opt.id,
      value: opt.value,
      name: opt.name,
      color: opt.color,
    }));

    // Save to localStorage (project-specific if projectId provided)
    const statusOptionsKey = projectId ? `statusOptions_${projectId}` : 'statusOptions';
    const fieldTitleKey = projectId ? `statusFieldTitle_${projectId}` : 'statusFieldTitle';
    const descriptionKey = projectId ? `statusFieldDescription_${projectId}` : 'statusFieldDescription';
    
    localStorage.setItem(statusOptionsKey, JSON.stringify(optionsToSave));
    localStorage.setItem(fieldTitleKey, fieldTitle);
    localStorage.setItem(descriptionKey, description);
    
    onSave(optionsToSave, fieldTitle, description);
    // Dispatch event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('statusOptionsUpdated'));
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset to saved values (project-specific if projectId provided)
    const statusOptionsKey = projectId ? `statusOptions_${projectId}` : 'statusOptions';
    const fieldTitleKey = projectId ? `statusFieldTitle_${projectId}` : 'statusFieldTitle';
    const descriptionKey = projectId ? `statusFieldDescription_${projectId}` : 'statusFieldDescription';
    
    const savedOptions = localStorage.getItem(statusOptionsKey);
    const savedFieldTitle = localStorage.getItem(fieldTitleKey);
    const savedDescription = localStorage.getItem(descriptionKey);
    
    if (savedFieldTitle) {
      setFieldTitle(savedFieldTitle);
    } else {
      setFieldTitle('Status');
    }
    
    if (savedDescription) {
      setDescription(savedDescription);
    } else {
      setDescription('Track the status of each task.');
    }

    if (savedOptions) {
      try {
        const parsed = JSON.parse(savedOptions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setOptions(parsed.map((opt: any, index: number) => ({
            id: opt.id || `option-${index}`,
            value: opt.value,
            name: opt.name || opt.value,
            color: opt.color || STATUS_COLORS_EXTENDED[index % STATUS_COLORS_EXTENDED.length],
          })));
        } else {
          const defaultOptions: StatusOption[] = ['Todo', 'In Progress', 'Done'].map((value, index) => ({
            id: `option-${index}`,
            value,
            name: value,
            color: STATUS_COLORS_EXTENDED[index % STATUS_COLORS_EXTENDED.length],
          }));
          setOptions(defaultOptions);
        }
      } catch (e) {
        const defaultOptions: StatusOption[] = ['Todo', 'In Progress', 'Done'].map((value, index) => ({
          id: `option-${index}`,
          value,
          name: value,
          color: STATUS_COLORS_EXTENDED[index % STATUS_COLORS_EXTENDED.length],
        }));
        setOptions(defaultOptions);
      }
    } else {
      const defaultOptions: StatusOption[] = ['Todo', 'In Progress', 'Done'].map((value, index) => ({
        id: `option-${index}`,
        value,
        name: value,
        color: STATUS_COLORS_EXTENDED[index % STATUS_COLORS_EXTENDED.length],
      }));
      setOptions(defaultOptions);
    }
    setNewOptionName('');
    setShowNewOptionField(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6">Edit field</Typography>
        <IconButton onClick={handleCancel} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 2 }}>
          <TextField
            label="Field title *"
            value={fieldTitle}
            onChange={(e) => setFieldTitle(e.target.value)}
            fullWidth
            size="small"
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box>
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Field type
                </Typography>
                <Chip label="Single-select" size="small" sx={{ bgcolor: 'action.hover' }} />
              </Box>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                fullWidth
                size="small"
                multiline
                rows={2}
              />
            </Grid>
          </Grid>

          <Box>
            <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
              Options *
            </Typography>
            <Stack spacing={1.5}>
              {options.map((option) => (
                <Box
                  key={option.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 1,
                    bgcolor: 'action.hover',
                  }}
                >
                  <Chip
                    label={option.value}
                    size="small"
                    sx={{
                      height: '24px',
                      fontSize: '13px',
                      fontWeight: 500,
                      bgcolor: option.color.bg,
                      color: option.color.text,
                      border: 'none',
                      minWidth: 60,
                      '& .MuiChip-label': {
                        px: 1.5,
                      },
                    }}
                  />
                  <TextField
                    value={option.name}
                    onChange={(e) => handleOptionChange(option.id, e.target.value)}
                    size="small"
                    fullWidth
                    placeholder=""
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteOption(option.id)}
                    title="Delete option"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              
              {/* Add new option input - only show when user clicks "+ Add an option" */}
              {showNewOptionField && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1.5,
                    borderRadius: 1,
                    border: '2px dashed',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Chip
                    label="New"
                    size="small"
                    sx={{
                      height: '24px',
                      fontSize: '13px',
                      fontWeight: 500,
                      bgcolor: '#fee2e2',
                      color: '#dc2626',
                      border: 'none',
                      minWidth: 60,
                      '& .MuiChip-label': {
                        px: 1.5,
                      },
                    }}
                  />
                  <TextField
                    value={newOptionName}
                    onChange={(e) => setNewOptionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelNewOption();
                      }
                    }}
                    autoFocus
                    size="small"
                    fullWidth
                    placeholder=""
                    sx={{ flex: 1 }}
                  />
                  <IconButton
                    size="small"
                    onClick={handleCancelNewOption}
                    title="Cancel"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Stack>
            
            {!showNewOptionField && (
              <Button
                onClick={handleShowNewOptionField}
                sx={{ mt: 1.5 }}
                size="small"
              >
                + Add an option
              </Button>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleCancel} color="error" sx={{ mr: 'auto' }}>
          Delete field
        </Button>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditStatusOptionsDialog;

