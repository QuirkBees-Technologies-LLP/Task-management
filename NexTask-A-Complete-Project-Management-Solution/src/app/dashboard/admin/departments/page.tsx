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
  Typography,
  CircularProgress,
  Stack,
  Pagination,
  InputAdornment,
  DialogContentText,
  Divider,
  Chip,
} from '@mui/material';
import {
  AddOutlined,
  EditOutlined,
  DeleteOutline,
  Search as SearchIcon,
  Close as CloseIcon,
  Search,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';

interface Position {
  _id: string;
  name: string;
}

interface Department {
  _id: string;
  name: string;
  positions: Position[];
  createdAt?: string;
  updatedAt?: string;
}

const DepartmentsPage: React.FC = () => {
  const router = useRouter();
  const { data: currentUser } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = currentUser?.role === 'Admin' || isSuperUser;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  // Form state
  const [departmentName, setDepartmentName] = useState('');
  const [positions, setPositions] = useState<Position[]>([
    { _id: new Date().getTime().toString(), name: '' }, // Position 1 auto-added (temporary ID for new positions)
  ]);

  useEffect(() => {
    if (!isAdmin) {
      router.push('/dashboard/projects'); // Redirect to projects instead of dashboard
      return;
    }
    fetchDepartments();
  }, [page, search, isAdmin]);

  const fetchDepartments = async () => {
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

      const response = await axios.get(`/api/departments?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDepartments(response.data.departments || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch departments',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedDepartment(null);
    setDepartmentName('');
    setPositions([{ _id: new Date().getTime().toString(), name: '' }]); // Reset to Position 1
    setDialogOpen(true);
  };

  const handleOpenEdit = (department: Department) => {
    setSelectedDepartment(department);
    setDepartmentName(department.name);
    // Load positions, ensuring at least one exists
    if (department.positions && department.positions.length > 0) {
      setPositions(department.positions);
    } else {
      setPositions([{ _id: new Date().getTime().toString(), name: '' }]);
    }
    setDialogOpen(true);
  };

  const handleAddPosition = () => {
    const newId = new Date().getTime().toString();
    setPositions([...positions, { _id: newId, name: '' }]);
  };

  const handleUpdatePosition = (id: string, name: string) => {
    setPositions(positions.map((pos) => (pos._id === id ? { ...pos, name } : pos)));
  };

  const handleRemovePosition = (id: string) => {
    // Don't allow removing if it's the only position
    if (positions.length <= 1) {
      enqueueSnackbar({
        message: 'At least one position is required',
        variant: 'error',
      });
      return;
    }
    setPositions(positions.filter((pos) => pos._id !== id));
  };

  const handleSave = async () => {
    // Validate department name
    if (!departmentName.trim()) {
      enqueueSnackbar({
        message: 'Department name is required',
        variant: 'error',
      });
      return;
    }

    // Validate positions - at least one position with a name
    const validPositions = positions.filter((pos) => pos.name.trim());
    if (validPositions.length === 0) {
      enqueueSnackbar({
        message: 'At least one position is required',
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

      const payload = {
        name: departmentName.trim(),
        positions: validPositions.map((pos) => ({ name: pos.name.trim() })),
      };

      if (selectedDepartment) {
        // Update
        await axios.patch(
          '/api/departments',
          {
            departmentId: selectedDepartment._id,
            ...payload,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        enqueueSnackbar({
          message: 'Department updated successfully!',
          variant: 'success',
        });
      } else {
        // Create
        await axios.post(
          '/api/departments',
          payload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        enqueueSnackbar({
          message: 'Department created successfully!',
          variant: 'success',
        });
      }

      setDialogOpen(false);
      fetchDepartments();
    } catch (error: any) {
      console.error('Error saving department:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to save department',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment) return;

    setSaving(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      await axios.delete(`/api/departments?_id=${selectedDepartment._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      enqueueSnackbar({
        message: 'Department deleted successfully!',
        variant: 'success',
      });
      setDeleteDialogOpen(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error: any) {
      console.error('Error deleting department:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete department',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          padding: "16px 24px",
          borderRadius: "12px",
          mb: 3,
        }}
      >
        <PageHeader
          title="Projects"
          className="top_header"
          sx={{ mb: "0 !important" }}
          action={
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                width: "100%",
                gap: 2,
              }}
            >
              {/* LEFT SIDE SEARCH BAR */}
              <TextField
                size="small"
                placeholder="Search by department name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="search"
                InputProps={{
                  startAdornment: <Search fontSize="small" />,
                }}
                sx={{
                  width: { xs: "unset", lg: "520px" },
                  maxWidth: "100%",
                  borderRadius: "6px",

                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.background.default
                      : "#F9FAFC",

                  "& .MuiOutlinedInput-root": {
                    gap: 1,
                    color: (theme) => theme.palette.text.primary,

                    "& fieldset": {
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                    },

                    "&:hover fieldset": {
                      borderColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? theme.palette.primary.main
                          : "#CBD5E1",
                    },
                  },
                }}
              />

              {/* RIGHT SIDE BUTTON */}
              {isAdmin && (
                <Button
                  variant="outlined"
                  startIcon={<AddOutlined />}
                  onClick={handleOpenCreate}
                  sx={{
                    borderRadius: "6px",
                    fontWeight: 500,
                    color: (theme) =>
                      theme.palette.mode === "dark" ? "#fff" : "#000",

                    borderColor: (theme) =>
                      theme.palette.mode === "dark" ? "#fff" : "#000",

                    "&:hover": {
                      borderColor: (theme) =>
                        theme.palette.mode === "dark" ? "#fff" : "#000",

                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark"
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  Add New Department
                </Button>
              )}
            </Box>
          }
        />
      </Box>
      <Paper sx={{ p: 3, mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Department Name</TableCell>
                <TableCell>Positions</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No departments found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((department) => (
                  <TableRow key={department._id} hover>
                    <TableCell>
                      <Typography variant="body1" fontWeight={500}>
                        {department.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {department.positions && department.positions.length > 0 ? (
                          department.positions.map((position, index) => (
                            <Chip
                              key={position._id || index}
                              label={position.name}
                              size="small"
                              variant="outlined"
                            />
                          ))
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No positions
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(department)}
                          color="primary"
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedDepartment(department);
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

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedDepartment ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Department Name"
              fullWidth
              required
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="Enter department name"
            />

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                Positions
              </Typography>
              <Stack spacing={2}>
                {positions.map((position, index) => (
                  <Box key={position._id}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        label={`Position ${index + 1}`}
                        fullWidth
                        value={position.name}
                        onChange={(e) => handleUpdatePosition(position._id, e.target.value)}
                        placeholder="Enter position name"
                        size="small"
                      />
                      {positions.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemovePosition(position._id)}
                          color="error"
                          sx={{ flexShrink: 0 }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
              <Button
                startIcon={<AddOutlined />}
                onClick={handleAddPosition}
                variant="outlined"
                size="small"
                sx={{ mt: 2 }}
              >
                Add Option
              </Button>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              saving ||
              !departmentName.trim() ||
              positions.filter((pos) => pos.name.trim()).length === 0
            }
          >
            {saving ? <CircularProgress size={20} /> : selectedDepartment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Department</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the department <strong>{selectedDepartment?.name}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDelete}
            color="error"
            variant="contained"
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DepartmentsPage;
