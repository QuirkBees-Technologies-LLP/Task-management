'use client';
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Stack,
  Chip,
  useTheme,
  Divider,
  Button,
} from '@mui/material';
import { Add, Delete, Edit, Check, Close, AttachFile } from '@mui/icons-material';
import { Subtask, TaskAttachment } from '../types';
import FileAttachmentDialog from './FileAttachmentDialog';
import { getStatusColor } from '../utils/statusColors';

interface SubtasksSectionProps {
  subtasks: Subtask[];
  onAddSubtask: (subtask: Omit<Subtask, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateSubtask: (id: string, subtask: Partial<Subtask>) => void;
  onDeleteSubtask: (id: string) => void;
  canEdit?: boolean;
  projectId?: string;
}

const SubtasksSection: React.FC<SubtasksSectionProps> = ({
  subtasks,
  onAddSubtask,
  onUpdateSubtask,
  onDeleteSubtask,
  canEdit = true,
  projectId,
}) => {
  const theme = useTheme();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState<boolean>(false);
  const [selectedSubtaskId, setSelectedSubtaskId] = useState<string | null>(null);

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim()) {
      onAddSubtask({
        title: newSubtaskTitle.trim(),
        description: '',
        status: 'Todo',
      });
      setNewSubtaskTitle('');
    }
  };

  const handleStartEdit = (subtask: Subtask) => {
    setEditingId(subtask.id || '');
    setEditingTitle(subtask.title);
  };

  const handleSaveEdit = () => {
    if (editingId && editingTitle.trim()) {
      onUpdateSubtask(editingId, { title: editingTitle.trim() });
      setEditingId(null);
      setEditingTitle('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingTitle('');
  };

  const handleStatusChange = (id: string, currentStatus: string) => {
    const statuses: ('Todo' | 'In Progress' | 'Done')[] = ['Todo', 'In Progress', 'Done'];
    const currentIndex = statuses.indexOf(currentStatus as 'Todo' | 'In Progress' | 'Done');
    const nextIndex = (currentIndex + 1) % statuses.length;
    onUpdateSubtask(id, { status: statuses[nextIndex] });
  };

  const handleAddAttachment = (attachment: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    attachmentType: 'file' | 'url' | 'google_drive' | 'onedrive' | 'box' | 'dropbox';
  }) => {
    if (selectedSubtaskId) {
      const subtask = subtasks.find((s) => s.id === selectedSubtaskId);
      if (subtask) {
        const newAttachment: TaskAttachment = {
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          fileType: attachment.fileType,
          fileSize: attachment.fileSize,
          attachmentType: attachment.attachmentType,
          uploadedAt: new Date().toISOString(),
        };
        const updatedAttachments = [...(subtask.attachments || []), newAttachment];
        onUpdateSubtask(selectedSubtaskId, { attachments: updatedAttachments });
      }
      setSelectedSubtaskId(null);
    }
  };

  const handleDeleteAttachment = (subtaskId: string, attachmentIndex: number) => {
    const subtask = subtasks.find((s) => s.id === subtaskId);
    if (subtask && subtask.attachments) {
      const updatedAttachments = subtask.attachments.filter((_, i) => i !== attachmentIndex);
      onUpdateSubtask(subtaskId, { attachments: updatedAttachments });
    }
  };

  const handleOpenAttachmentDialog = (subtaskId: string) => {
    setSelectedSubtaskId(subtaskId);
    setAttachmentDialogOpen(true);
  };


  return (
    <Box>
      <Typography
        variant="subtitle2"
        sx={{
          mb: 2,
          color: theme.palette.text.secondary,
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: '11px',
          letterSpacing: '0.5px',
        }}
      >
        Subtasks ({subtasks.length})
      </Typography>

      {canEdit && (
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <TextField
            placeholder="Add a subtask"
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddSubtask();
              }
            }}
            size="small"
            fullWidth
            sx={{ flex: 1 }}
          />
          <IconButton onClick={handleAddSubtask} color="primary" disabled={!newSubtaskTitle.trim()}>
            <Add />
          </IconButton>
        </Stack>
      )}

      {subtasks.length === 0 ? (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
          No subtasks yet
        </Typography>
      ) : (
        <Stack spacing={1}>
          {subtasks.map((subtask) => (
            <Box
              key={subtask.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                borderRadius: 1,
                '&:hover': {
                  bgcolor: theme.palette.action.hover,
                },
              }}
            >
              {editingId === subtask.id ? (
                <Stack direction="row" spacing={1} sx={{ flex: 1 }}>
                  <TextField
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    size="small"
                    fullWidth
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                  />
                  <IconButton onClick={handleSaveEdit} size="small" color="primary">
                    <Check fontSize="small" />
                  </IconButton>
                  <IconButton onClick={handleCancelEdit} size="small">
                    <Close fontSize="small" />
                  </IconButton>
                </Stack>
              ) : (
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        flex: 1,
                        textDecoration: subtask.status === 'Done' ? 'line-through' : 'none',
                        color:
                          subtask.status === 'Done'
                            ? theme.palette.text.secondary
                            : theme.palette.text.primary,
                      }}
                    >
                      {subtask.title}
                    </Typography>
                    <Chip
                      label={subtask.status}
                      size="small"
                      sx={{
                        height: '20px',
                        fontSize: '10px',
                        bgcolor: getStatusColor(subtask.status, projectId).bg,
                        color: getStatusColor(subtask.status, projectId).text,
                      }}
                    />
                    {canEdit && (
                      <>
                        <IconButton
                          onClick={() => handleOpenAttachmentDialog(subtask.id || '')}
                          size="small"
                          sx={{ p: 0.5 }}
                          title="Add attachment"
                        >
                          <AttachFile fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleStartEdit(subtask)}
                          size="small"
                          sx={{ p: 0.5 }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => onDeleteSubtask(subtask.id || '')}
                          size="small"
                          sx={{ p: 0.5 }}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                  {subtask.attachments && subtask.attachments.length > 0 && (
                    <Stack spacing={0.5} sx={{ ml: 4, mt: 0.5 }}>
                      {subtask.attachments.map((attachment, index) => (
                        <Stack
                          key={index}
                          direction="row"
                          alignItems="center"
                          spacing={0.5}
                          sx={{
                            p: 0.5,
                            borderRadius: 0.5,
                            bgcolor: theme.palette.action.hover,
                          }}
                        >
                          <AttachFile fontSize="small" sx={{ color: theme.palette.text.secondary, fontSize: '12px' }} />
                          <Typography
                            variant="caption"
                            sx={{
                              flex: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              fontSize: '11px',
                            }}
                          >
                            {attachment.fileName}
                          </Typography>
                          <Button
                            size="small"
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ minWidth: 'auto', px: 1, fontSize: '11px' }}
                          >
                            View
                          </Button>
                          {canEdit && (
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteAttachment(subtask.id || '', index)}
                              color="error"
                              sx={{ p: 0.25 }}
                            >
                              <Delete fontSize="small" sx={{ fontSize: '12px' }} />
                            </IconButton>
                          )}
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
            </Box>
          ))}
        </Stack>
      )}

      <FileAttachmentDialog
        open={attachmentDialogOpen}
        onClose={() => {
          setAttachmentDialogOpen(false);
          setSelectedSubtaskId(null);
        }}
        onAddAttachment={handleAddAttachment}
      />
    </Box>
  );
};

export default SubtasksSection;

