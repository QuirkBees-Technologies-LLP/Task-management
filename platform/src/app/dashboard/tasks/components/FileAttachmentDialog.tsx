'use client';
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  TextField,
  Typography,
  IconButton,
  Stack,
  useTheme,
} from '@mui/material';
import { CloseOutlined, CloudUpload, Link as LinkIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

interface FileAttachmentDialogProps {
  open: boolean;
  onClose: () => void;
  onAddAttachment: (attachment: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize?: number;
    attachmentType: 'file' | 'url' | 'google_drive' | 'onedrive' | 'box' | 'dropbox';
  }) => void;
}

const FileAttachmentDialog: React.FC<FileAttachmentDialogProps> = ({
  open,
  onClose,
  onAddAttachment,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [url, setUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setUrl('');
    setSelectedFile(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert('File size exceeds 50MB limit');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(event.target.value);
  };

  const handleUpload = async () => {
    if (activeTab === 0 && selectedFile) {
      // File upload
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const token = safeLocalStorageGet(accessTokenKey);
        if (!token) {
          throw new Error('Authentication required');
        }
        
        const response = await fetch('/api/tasks/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        onAddAttachment({
          fileName: selectedFile.name,
          fileUrl: data.fileUrl,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          attachmentType: 'file',
        });
        handleClose();
      } catch (error) {
        console.error('Upload error:', error);
        alert('Failed to upload file. Please try again.');
      } finally {
        setUploading(false);
      }
    } else if (activeTab === 1 && url.trim()) {
      // Google Drive attachment
      onAddAttachment({
        fileName: url,
        fileUrl: url,
        fileType: 'url',
        attachmentType: 'google_drive',
      });
      handleClose();
    } else if (activeTab === 2 && url.trim()) {
      // OneDrive/SharePoint attachment
      onAddAttachment({
        fileName: url,
        fileUrl: url,
        fileType: 'url',
        attachmentType: 'onedrive',
      });
      handleClose();
    } else if (activeTab === 3 && url.trim()) {
      // URL attachment
      onAddAttachment({
        fileName: url,
        fileUrl: url,
        fileType: 'url',
        attachmentType: 'url',
      });
      handleClose();
    } else {
      alert('Please provide a valid link or select a file');
    }
  };

  const handleClose = () => {
    setActiveTab(0);
    setUrl('');
    setSelectedFile(null);
    setUploading(false);
    onClose();
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 0: // Upload
        return (
          <Box sx={{ py: 3 }}>
            <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
              Select or drag files from your computer
            </Typography>
            <Button
              component="label"
              variant="outlined"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{
                py: 2,
                borderStyle: 'dashed',
                borderWidth: 2,
              }}
            >
              Choose a file
              <VisuallyHiddenInput
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp,.mp4,.avi,.mov"
              />
            </Button>
            {selectedFile && (
              <Typography variant="body2" sx={{ mt: 2, color: theme.palette.text.primary }}>
                Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
              </Typography>
            )}
          </Box>
        );
      case 1: // Google Drive
        return (
          <Box sx={{ py: 3 }}>
            <TextField
              fullWidth
              placeholder="Paste a Google Drive file"
              value={url}
              onChange={handleUrlChange}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Paste a Google Drive file link to attach it to this task
            </Typography>
          </Box>
        );
      case 2: // OneDrive/SharePoint
        return (
          <Box sx={{ py: 3 }}>
            <TextField
              fullWidth
              placeholder="Paste a OneDrive/SharePoint file or folder link"
              value={url}
              onChange={handleUrlChange}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Paste a OneDrive or SharePoint file/folder link to attach it to this task
            </Typography>
          </Box>
        );
      case 3: // URL
        return (
          <Box sx={{ py: 3 }}>
            <TextField
              fullWidth
              placeholder="Paste any URL"
              value={url}
              onChange={handleUrlChange}
              sx={{ mb: 2 }}
            />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Paste any URL to attach it to this task
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  const canSubmit = () => {
    if (activeTab === 0) return selectedFile !== null;
    if ([1, 2, 3].includes(activeTab)) return url.trim() !== '';
    return false;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Typography variant="h6" component="div">Attach File</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseOutlined />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
          <Tab label="Upload" />
          <Tab label="Google Drive" />
          <Tab label="OneDrive/SharePoint" />
          <Tab label="URL" />
        </Tabs>
        {renderTabContent()}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!canSubmit() || uploading}
        >
          {uploading ? 'Uploading...' : 'Attach'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileAttachmentDialog;

