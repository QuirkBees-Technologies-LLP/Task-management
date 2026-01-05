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
import { getPriorityColor, PRIORITY_OPTIONS, PriorityValue } from '../utils/priorityColors';

interface PriorityOption {
  id: string;
  value: PriorityValue;
  name: string;
  color: { bg: string; text: string };
}

interface EditPriorityOptionsDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (options: Record<PriorityValue, string>, fieldTitle: string, description: string) => void;
  projectId?: string;
}

const EditPriorityOptionsDialog: React.FC<EditPriorityOptionsDialogProps> = ({
  open,
  onClose,
  onSave,
  projectId,
}) => {
  const [fieldTitle, setFieldTitle] = useState('Priority');
  const [description, setDescription] = useState('Track the priority of each task.');
  const [options, setOptions] = useState<PriorityOption[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [showNewOptionField, setShowNewOptionField] = useState(false);

  useEffect(() => {
    if (open) {
      // Load saved custom names from localStorage (project-specific if projectId provided)
      const priorityCustomNamesKey = projectId ? `priorityCustomNames_${projectId}` : 'priorityCustomNames';
      const fieldTitleKey = projectId ? `priorityFieldTitle_${projectId}` : 'priorityFieldTitle';
      const descriptionKey = projectId ? `priorityFieldDescription_${projectId}` : 'priorityFieldDescription';
      
      const savedOptions = localStorage.getItem(priorityCustomNamesKey);
      const savedFieldTitle = localStorage.getItem(fieldTitleKey);
      const savedDescription = localStorage.getItem(descriptionKey);
      
      if (savedFieldTitle) {
        setFieldTitle(savedFieldTitle);
      }
      if (savedDescription) {
        setDescription(savedDescription);
      }

      const defaultOptions: PriorityOption[] = PRIORITY_OPTIONS.map((priority, index) => {
        const colors = getPriorityColor(priority);
        return {
          id: `option-${index}`,
          value: priority,
          name: priority,
          color: colors,
        };
      });

      if (savedOptions) {
        try {
          const parsed = JSON.parse(savedOptions);
          const updatedOptions = defaultOptions.map((opt) => ({
            ...opt,
            name: parsed[opt.value] || opt.name,
          }));
          setOptions(updatedOptions);
        } catch (e) {
          console.error('Error loading priority custom names:', e);
          setOptions(defaultOptions);
        }
      } else {
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
    const baseColors = [
      { bg: '#D1FAE5', text: '#065F46' }, // Low color
      { bg: '#FEF3C7', text: '#92400E' }, // Medium color
      { bg: '#E9D5FF', text: '#6B21A8' }, // High color
      { bg: '#DBEAFE', text: '#1E40AF' }, // Blue
      { bg: '#FCE7F3', text: '#9F1239' }, // Pink
      { bg: '#FED7AA', text: '#9A3412' }, // Orange
      { bg: '#D1D5DB', text: '#374151' }, // Gray
      { bg: '#FDE68A', text: '#78350F' }, // Yellow
      { bg: '#C7D2FE', text: '#3730A3' }, // Indigo
      { bg: '#FCD34D', text: '#78350F' }, // Amber
    ];

    // Find first unused color
    let selectedColor = baseColors[0];
    for (const color of baseColors) {
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

    const newOption: PriorityOption = {
      id: `option-${Date.now()}`,
      value: newOptionName.trim() as PriorityValue,
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
    // Convert options array to record format
    const optionsRecord: Record<string, string> = {};
    options.forEach((opt) => {
      optionsRecord[opt.value] = opt.name;
    });

    // Save to localStorage (project-specific if projectId provided)
    const priorityCustomNamesKey = projectId ? `priorityCustomNames_${projectId}` : 'priorityCustomNames';
    const fieldTitleKey = projectId ? `priorityFieldTitle_${projectId}` : 'priorityFieldTitle';
    const descriptionKey = projectId ? `priorityFieldDescription_${projectId}` : 'priorityFieldDescription';
    
    localStorage.setItem(priorityCustomNamesKey, JSON.stringify(optionsRecord));
    localStorage.setItem(fieldTitleKey, fieldTitle);
    localStorage.setItem(descriptionKey, description);
    
    onSave(optionsRecord, fieldTitle, description);
    // Dispatch event to notify other components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('priorityOptionsUpdated'));
    }
    onClose();
  };

  const handleCancel = () => {
    // Reset to saved values (project-specific if projectId provided)
    const priorityCustomNamesKey = projectId ? `priorityCustomNames_${projectId}` : 'priorityCustomNames';
    const fieldTitleKey = projectId ? `priorityFieldTitle_${projectId}` : 'priorityFieldTitle';
    const descriptionKey = projectId ? `priorityFieldDescription_${projectId}` : 'priorityFieldDescription';
    
    const savedOptions = localStorage.getItem(priorityCustomNamesKey);
    const savedFieldTitle = localStorage.getItem(fieldTitleKey);
    const savedDescription = localStorage.getItem(descriptionKey);
    
    if (savedFieldTitle) {
      setFieldTitle(savedFieldTitle);
    } else {
      setFieldTitle('Priority');
    }
    
    if (savedDescription) {
      setDescription(savedDescription);
    } else {
      setDescription('Track the priority of each task.');
    }

    const defaultOptions: PriorityOption[] = PRIORITY_OPTIONS.map((priority, index) => {
      const colors = getPriorityColor(priority);
      return {
        id: `option-${index}`,
        value: priority,
        name: priority,
        color: colors,
      };
    });

    if (savedOptions) {
      try {
        const parsed = JSON.parse(savedOptions);
        const updatedOptions = defaultOptions.map((opt) => ({
          ...opt,
          name: parsed[opt.value] || opt.name,
        }));
        setOptions(updatedOptions);
      } catch (e) {
        setOptions(defaultOptions);
      }
    } else {
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

export default EditPriorityOptionsDialog;

