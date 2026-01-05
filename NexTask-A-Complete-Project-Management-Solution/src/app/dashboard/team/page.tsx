'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Avatar,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  AddOutlined,
  EditOutlined,
  DeleteOutline,
  Search as SearchIcon,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';

interface Staff {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  position?: string;
  departmentId?: string;
  positionId?: string;
  phone?: string;
}

interface Department {
  _id: string;
  name: string;
  positions: Array<{ _id: string; name: string }>;
}

const StaffManagementPage: React.FC = () => {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [availablePositions, setAvailablePositions] = useState<Array<{ _id: string; name: string }>>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'Regular',
    departmentId: '',
    positionId: '',
    phone: '',
  });

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
  }, [page, search]);

  useEffect(() => {
    // Update available positions when department changes
    if (formData.departmentId) {
      const selectedDept = departments.find((d) => d._id === formData.departmentId);
      if (selectedDept) {
        setAvailablePositions(selectedDept.positions || []);
        // Validate current positionId - if it doesn't exist in new department, reset it
        if (formData.positionId) {
          const positionExists = selectedDept.positions?.some((pos) => pos._id === formData.positionId);
          if (!positionExists) {
            setFormData((prev) => ({ ...prev, positionId: '' }));
          }
        }
      } else {
        setAvailablePositions([]);
      }
    } else {
      setAvailablePositions([]);
    }
  }, [formData.departmentId, departments]);

  const fetchDepartments = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/departments?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDepartments(response.data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await axios.get(`/api/staff?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setStaff(response.data.staff || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch staff',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedStaff(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      role: 'Regular',
      departmentId: '',
      positionId: '',
      phone: '',
    });
    setAvailablePositions([]);
    setDialogOpen(true);
  };

  const handleOpenEdit = (item: Staff) => {
    setSelectedStaff(item);
    setFormData({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      role: item.role || 'Regular',
      departmentId: item.departmentId || '',
      positionId: item.positionId || '',
      phone: item.phone || '',
    });
    // Set available positions for the selected department
    if (item.departmentId) {
      const selectedDept = departments.find((d) => d._id === item.departmentId);
      if (selectedDept) {
        setAvailablePositions(selectedDept.positions || []);
      }
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      enqueueSnackbar({
        message: 'First name, last name, and email are required',
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      if (selectedStaff) {
        await axios.patch(
          '/api/staff',
          { staffId: selectedStaff._id, ...formData },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        enqueueSnackbar({ message: 'Staff updated successfully', variant: 'success' });
      } else {
        await axios.post('/api/staff', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        enqueueSnackbar({ message: 'Staff created successfully', variant: 'success' });
      }

      setDialogOpen(false);
      fetchStaff();
    } catch (error: any) {
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to save staff',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;

    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      await axios.delete(`/api/staff?_id=${selectedStaff._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      enqueueSnackbar({ message: 'Staff deleted successfully', variant: 'success' });
      setDeleteDialogOpen(false);
      setSelectedStaff(null);
      fetchStaff();
    } catch (error: any) {
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete staff',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading && staff.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader
        title="Staff Management"
        action={
          <Button variant="contained" startIcon={<AddOutlined />} onClick={handleOpenCreate}>
            Add Staff
          </Button>
        }
      />

      <Box sx={{ mt: 3 }}>
        <Paper sx={{ p: 2, mb: 3 }}>
          <TextField
            placeholder="Search staff..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Paper>

        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Staff</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No staff found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((item) => (
                    <TableRow key={item._id} hover>
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                            {item.firstName?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">
                            {item.firstName} {item.lastName}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={item.role}
                          color={item.role === 'Admin' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{item.department || '-'}</TableCell>
                      <TableCell>{item.position || '-'}</TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <IconButton size="small" onClick={() => handleOpenEdit(item)} color="primary">
                            <EditOutlined fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedStaff(item);
                              setDeleteDialogOpen(true);
                            }}
                            color="error"
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedStaff ? 'Edit Staff' : 'Add Staff'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            <TextField
              label="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
              required
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
              required
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={formData.role}
                onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                label="Role"
              >
                <MenuItem value="Regular">Regular</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Phone"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Department</InputLabel>
              <Select
                value={formData.departmentId}
                onChange={(e) => setFormData((prev) => ({ ...prev, departmentId: e.target.value, positionId: '' }))}
                label="Department"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {departments.map((dept) => (
                  <MenuItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth disabled={!formData.departmentId}>
              <InputLabel>Position</InputLabel>
              <Select
                value={formData.positionId}
                onChange={(e) => setFormData((prev) => ({ ...prev, positionId: e.target.value }))}
                label="Position"
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {availablePositions.map((pos) => (
                  <MenuItem key={pos._id} value={pos._id}>
                    {pos.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving || !formData.firstName || !formData.lastName || !formData.email}
            startIcon={saving && <CircularProgress size={15} color="inherit" />}
          >
            {selectedStaff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Staff</DialogTitle>
        <DialogContent>
          {selectedStaff && (
            <Typography>
              Are you sure you want to delete <strong>{selectedStaff.firstName} {selectedStaff.lastName}</strong>? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={saving}
            startIcon={saving && <CircularProgress size={15} color="inherit" />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StaffManagementPage;
