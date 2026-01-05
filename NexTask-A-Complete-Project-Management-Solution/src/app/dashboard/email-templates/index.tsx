'use client';

import React, { useEffect, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { selectEmailTemplates } from '@/redux/selectors';
import PageHeader from '@/components/PageHeader';
import { loadEmailTemplates, saveEmailTemplates } from '@/redux/slices';
import ResponsiveTable from '@/components/Table';
import { Add, InfoOutlined } from '@mui/icons-material';
import { emailTemplateVariables } from '@/utils/constants';

const initialData = {
  name: '',
  description: '',
  htmlString: '',
  emailType: 'invite',
};

const emailTypeOptions = [
  { value: 'invite', label: 'Invite' },
  { value: 'emailConfirm', label: 'Email Confirmation' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'feedback', label: 'Feedback' },
  { value: 'onboard', label: 'Onboard' },
];

export default function EmailTemplatesPage() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { data: templates, loading, saving } = useSelector(selectEmailTemplates);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(initialData);
  const [formData, setFormData] = useState(initialData);

  // Fetch email templates on component mount
  useEffect(() => {
    dispatch(loadEmailTemplates());
  }, []);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle form submission for creating or updating a template
  const handleSubmit = () => {
    if (editingTemplate) {
      // Update existing template
      dispatch(
        saveEmailTemplates({
          formData,
          editingTemplate,
          setOpenDialog,
        })
      );
    } else {
      // Create new template
      dispatch(saveEmailTemplates({ formData, setOpenDialog }));
    }
  };

  useEffect(() => {
    if (!openDialog) {
      setFormData(initialData);
      setEditingTemplate(null);
    }
  }, [openDialog]);

  // Open dialog for creating or editing a template
  const handleOpenDialog = (template = null) => {
    setEditingTemplate(template);
    setFormData(
      template
        ? {
            name: template.name,
            description: template.description,
            htmlString: template.htmlString,
            emailType: template.emailType,
          }
        : initialData
    );
    setOpenDialog(true);
  };

  // Open dialog for viewing a template
  const handleViewTemplate = (template) => {
    setViewingTemplate(template);
    setViewDialog(true);
  };

  // Define columns for the ResponsiveTable
  const columns = [
    { key: 'name', title: 'Name' },
    { key: 'description', title: 'Description' },
    {
      key: 'emailType',
      title: 'Email Type',
      render: (item) => emailTypeOptions.find((option) => option.value === item.emailType)?.label,
    },
  ];

  return (
    <>
      <PageHeader
        title="Email Templates"
        action={
          <Button variant="contained" onClick={() => handleOpenDialog()} startIcon={<Add />}>
            New Template
          </Button>
        }
      />
      <Paper sx={{ p: isSmallScreen ? 2 : 0 }}>
        <ResponsiveTable
          data={templates}
          columns={columns}
          renderActions={(template) => (
            <>
              <Button color="primary" onClick={() => handleViewTemplate(template)} sx={{ mr: 1 }}>
                View
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => handleOpenDialog(template)}
              >
                Edit
              </Button>
            </>
          )}
          listKeys={{
            primaryKeys: ['name'],
            secondaryKeys: ['description'],
          }}
          loading={loading}
        />
      </Paper>

      {/* Dialog for creating or editing a template */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
        <DialogTitle>
          <Stack direction={'row'} gap={1} alignItems={'center'}>
            <>{editingTemplate ? 'Edit Email Template' : 'Create Email Template'}</>
            <Tooltip
              title={
                <Box p={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    <b>Email Template Variables:</b>
                  </Typography>
                  <ul>
                    {Object.entries(emailTemplateVariables).map(([key, value]) => (
                      <li key={key}>
                        <Typography variant="caption">
                          <b>{key}:</b> {value}
                        </Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              }
            >
              <InfoOutlined fontSize="small" color="primary" />
            </Tooltip>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <Autocomplete
            id="emailType"
            options={emailTypeOptions}
            getOptionLabel={(option) => option.label}
            value={emailTypeOptions.find((option) => option.value === formData.emailType)}
            onChange={(event, newValue) => {
              setFormData((prev) => ({ ...prev, emailType: newValue.value }));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Email Type" margin="normal" required />
            )}
            sx={{ mt: 1 }}
            disableClearable
          />
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="HTML String"
            name="htmlString"
            value={formData.htmlString}
            onChange={handleInputChange}
            margin="normal"
            multiline
            required
            slotProps={{
              input: {
                multiline: true,
                minRows: 4,
              },
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={saving} onClick={() => setOpenDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button disabled={saving} onClick={handleSubmit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog for viewing a template */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} fullWidth>
        <DialogTitle>{viewingTemplate.name}</DialogTitle>
        <DialogContent>
          {viewingTemplate && (
            <Box>
              <Typography gutterBottom>
                <b>Description:</b> {viewingTemplate.description}
              </Typography>
              <Typography gutterBottom sx={{ mb: 2 }}>
                <b>Email Type:</b>{' '}
                {
                  emailTypeOptions.find((option) => option.value === viewingTemplate.emailType)
                    ?.label
                }
              </Typography>
              <iframe
                srcDoc={viewingTemplate.htmlString}
                style={{
                  width: '100%',
                  height: '300px',
                  border: 'none',
                }}
                sandbox="allow-same-origin"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
