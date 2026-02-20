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
  Menu,
  Grid2,
} from '@mui/material';
import {
  AddOutlined,
  EditOutlined,
  DeleteOutline,
  Search as SearchIcon,
  CloseOutlined,
  Search,
  MoreVert,
  Edit,
  Delete,
} from '@mui/icons-material';
import PageHeader from '@/components/PageHeader';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';

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
  password?: string; // Plain text password for admin viewing
}

interface Department {
  _id: string;
  name: string;
  positions: Array<{ _id: string; name: string }>;
}
const getPositionStyles = (position?: string, mode?: 'light' | 'dark') => {
  const darkBoost = mode === 'dark' ? 0.25 : 0.15;

  if (!position) {
    return { bg: `rgba(107,114,128,${darkBoost})`, color: '#9CA3AF' };
  }

  const v = position.toLowerCase();

  if (v.includes('full stack'))
    return { bg: `rgba(168,85,247,${darkBoost})`, color: '#A855F7' };

  if (v.includes('ui') || v.includes('ux'))
    return { bg: `rgba(34,197,94,${darkBoost})`, color: '#22C55E' };

  if (v.includes('backend'))
    return { bg: `rgba(59,130,246,${darkBoost})`, color: '#3B82F6' };

  if (v.includes('qa'))
    return { bg: `rgba(14,165,233,${darkBoost})`, color: '#0EA5E9' };

  if (v.includes('lead'))
    return { bg: `rgba(56,189,248,${darkBoost})`, color: '#38BDF8' };

  return { bg: `rgba(59,130,246,${darkBoost})`, color: '#3B82F6' };
};


const StaffManagementPage: React.FC = () => {
  const router = useRouter();
  const { data: currentUser } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = currentUser?.role === 'Admin' || isSuperUser;
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
    password: '',
    role: 'Regular',
    departmentId: '',
    positionId: '',
    phone: '',
  });

  useEffect(() => {
    fetchStaff();
    fetchDepartments();
  }, [page, search]);

  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, staff: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedStaff(staff);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Do NOT clear selectedStaff here, as it's needed for the menu actions (Edit/Delete)
    // It will be updated when opening the menu for another user
  };

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
        const staffData = response.data.staff || [];
        // Debug: Log to see if password field is present
        if (staffData.length > 0) {
          console.log('Fetched staff data sample:', {
            email: staffData[0].email,
            hasPassword: !!staffData[0].password,
            passwordLength: staffData[0].password?.length || 0,
            passwordValue: staffData[0].password ? '***' : 'EMPTY'
          });
        }
        setStaff(staffData);
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
      password: '',
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
    // Debug: Log the item to see what password field we're getting
    console.log('Editing staff item:', { email: item.email, password: item.password, hasPassword: !!item.password });
    setFormData({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      email: item.email || '',
      password: item.password || '', // Show existing password to admin (plain text) - this should come from API as plainTextPassword
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

    // Password is required for new staff, optional for updates
    if (!selectedStaff && !formData.password) {
      enqueueSnackbar({
        message: 'Password is required for new staff members',
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
      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.paper,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          padding: "16px 24px",
          borderRadius: "8px",
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
                placeholder="Search staff.."
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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
                  Add Staff
                </Button>
              )}
            </Box>
          }
        />
      </Box>

      <Box sx={{ mt: 3 }}>
        <Paper
          elevation={0}
          sx={(theme) => ({
            borderRadius: '8px',
            overflow: 'hidden',
            border: theme.palette.mode === 'dark'
              ? '1px solid #2A2F3A'
              : '1px solid #EDEFF3',
            backgroundColor: theme.palette.mode === 'dark'
              ? '#0F172A'
              : '#FFFFFF',
          })}
        >
          <TableContainer>
            <Table>
              {/* ================= TABLE HEAD ================= */}
              <TableHead>
                <TableRow
                  sx={(theme) => ({
                    backgroundColor:
                      theme.palette.mode === 'dark'
                        ? '#111827'
                        : '#FAFBFD',
                    '& th': {
                      fontSize: 13,
                      fontWeight: 500,
                      color:
                        theme.palette.mode === 'dark'
                          ? '#9CA3AF'
                          : 'text.secondary',
                      borderBottom:
                        theme.palette.mode === 'dark'
                          ? '1px solid #1F2937'
                          : '1px solid #EDEFF3',
                    },
                  })}
                >
                  <TableCell sx={{ minWidth: '220px' }}>Staff</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell sx={{ minWidth: '200px' }}>Department</TableCell>
                  <TableCell>Position</TableCell>
                  <TableCell align="left">Actions</TableCell>
                </TableRow>
              </TableHead>

              {/* ================= TABLE BODY ================= */}
              <TableBody>
                {staff.length === 0 ? (
                  <TableRow
                    key="no-staff"
                    hover
                    sx={(theme) => ({
                      '& td': {
                        fontSize: 13,
                        borderBottom:
                          theme.palette.mode === 'dark'
                            ? '1px solid #1F2937'
                            : '1px solid #EEF0F4',
                        color:
                          theme.palette.mode === 'dark'
                            ? '#E5E7EB'
                            : '#111827',
                      },
                      '&:hover': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? '#111827'
                            : '#FAFBFF',
                      },
                    })}
                  >
                    <TableCell colSpan={6} align="center">
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ py: 4 }}
                      >
                        No staff found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  staff.map((item) => (
                    <TableRow
                      key={item._id}
                      hover
                      sx={{
                        '& td': {
                          borderBottom: '1px solid #EEF0F4',
                          fontSize: 13,
                        },
                        '&:hover': {
                          backgroundColor: '#FAFBFF',
                        },
                      }}
                    >
                      {/* Staff */}
                      <TableCell>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={(theme) => ({
                              width: 38,
                              height: 38,
                              borderRadius: '8px',
                              bgcolor:
                                theme.palette.mode === 'dark'
                                  ? '#1F2937'
                                  : '#F3F4F6',
                              color:
                                theme.palette.mode === 'dark'
                                  ? '#E5E7EB'
                                  : '#111827',
                              fontWeight: 600,
                              fontSize: 15,
                            })}
                          >
                            {item.firstName?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography fontWeight={500}>
                            {item.firstName} {item.lastName}
                          </Typography>
                        </Stack>
                      </TableCell>

                      {/* Email */}
                      <TableCell
                        sx={(theme) => ({
                          color:
                            theme.palette.mode === 'dark'
                              ? '#9CA3AF'
                              : 'text.secondary',
                        })}
                      >
                        {item.email}
                      </TableCell>

                      {/* Role */}
                      < TableCell >
                        <Chip
                          label={item.role}
                          size="small"
                          sx={(theme) => ({
                            fontWeight: 500,
                            minWidth: 'fit-content',
                            borderRadius: '4px',
                            fontSize: '12px',
                            backgroundColor:
                              item.role === 'Admin'
                                ? theme.palette.mode === 'dark'
                                  ? 'rgba(255,106,0,0.2)'
                                  : 'rgba(255,106,0,0.12)'
                                : theme.palette.mode === 'dark'
                                  ? 'rgba(124,58,237,0.2)'
                                  : 'rgba(124,58,237,0.12)',
                            color:
                              item.role === 'Admin'
                                ? '#FF6A00'
                                : '#7C3AED',
                          })}
                        />
                      </TableCell>

                      {/* Department */}
                      <TableCell>
                        <Typography fontSize={13}>
                          {item.department || '-'}
                        </Typography>
                      </TableCell>

                      {/* Position */}
                      <TableCell>
                        {(() => {
                          const style = getPositionStyles(item.position);
                          return (
                            <Chip
                              label={item.position || '-'}
                              size="small"
                              sx={{
                                fontWeight: 500,
                                minWidth: 'fit-content',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: style.bg,
                                color: style.color,
                              }}
                            />
                          );
                        })()}
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="left">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, item)}
                          sx={(theme) => ({
                            color:
                              theme.palette.mode === 'dark'
                                ? '#9CA3AF'
                                : '#6B7280',
                          })}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>

                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper >

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      </Box >

      {/* Action Menu - Moved outside loop to prevent "Delete Yourself" bug */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: (theme) => ({
            borderRadius: '8px',
            minWidth: 160,
            bgcolor:
              theme.palette.mode === 'dark'
                ? '#111827'
                : '#FFFFFF',
            border: `1px solid ${theme.palette.mode === 'dark' ? '#1F2937' : '#E5E7EB'
              }`,
          }),
        }}
      >
        {/* Edit */}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedStaff) {
              handleOpenEdit(selectedStaff);
            }
          }}
          sx={{
            gap: 1.5,
            color: 'text.primary',
          }}
        >
          Edit
        </MenuItem>

        {/* Delete */}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            // selectedStaff is ALREADY set by handleMenuOpen, and we DON'T clear it in handleMenuClose anymore
            // So we can safely use it here.
            setDeleteDialogOpen(true);
          }}
          sx={{
            gap: 1.5,
            color: 'error.main',
          }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Create/Edit Dialog */}
      < Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth >
        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {selectedStaff ? 'Edit Staff' : 'Add Staff'}
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ paddingBlock: 24 }} dividers>
          <Stack spacing={3}>
            <Grid2 container spacing={2}>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                  required
                  fullWidth
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                  required
                  fullWidth
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  required
                  fullWidth
                />
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Password"
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  required={!selectedStaff}
                  fullWidth
                  helperText={selectedStaff ? 'Password is visible to admin. Enter new password to update.' : 'Password will be visible to admin'}
                />
              </Grid2>
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
              <Grid2 size={{ xs: 12, md: 6 }}>
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
              </Grid2>
              <Grid2 size={{ xs: 12, md: 6 }}>
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
              </Grid2>
            </Grid2>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderColor: 'divider',
          }}
        >
          {/* ================= CLOSE ================= */}
          <Button
            onClick={() => setDialogOpen(false)} disabled={saving}
            variant="outlined"
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              py: 1.25,
              fontWeight: 500,

              color: (theme) => theme.palette.text.primary,
              borderColor: (theme) => theme.palette.divider,

              backgroundColor: 'transparent',

              '&:hover': {
                backgroundColor: (theme) => theme.palette.action.hover,
                borderColor: (theme) => theme.palette.text.secondary,
              },
            }}
          >
            Close
          </Button>

          {/* ================= SAVE ================= */}
          <Button
            onClick={handleSave}
            type="submit"
            variant="contained"
            disabled={saving || !formData.firstName || !formData.lastName || !formData.email || (!selectedStaff && !formData.password)}
            startIcon={saving && <CircularProgress size={15} color="inherit" />}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              px: 3,
              py: 1.25,
              fontWeight: 500,
              backgroundColor: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[100]
                  : theme.palette.grey[900],

              color: (theme) =>
                theme.palette.mode === 'dark'
                  ? theme.palette.grey[900]
                  : '#ffffff',

              boxShadow: 'none',

              '&:hover': {
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark'
                    ? theme.palette.grey[200]
                    : '#000000',
                boxShadow: 'none',
              },
            }}
          >
            {selectedStaff ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog >

      {/* Delete Dialog */}
      < Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
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
      </Dialog >
    </>
  );
};

export default StaffManagementPage;
