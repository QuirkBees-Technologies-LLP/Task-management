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
  Menu,
  MenuItem,
} from '@mui/material';
import {
  AddOutlined,
  EditOutlined,
  DeleteOutline,
  Search as SearchIcon,
  Close as CloseIcon,
  CloseOutlined,
  Search,
  MoreVert,
  Edit,
  Delete,
  AccountTree,
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
const getPositionStyles = (name = '') => {
  const text = name.toLowerCase();

  /* ================= PURPLE ================= */
  if (
    text.includes('digital marketing') ||
    text.includes('technical lead') ||
    text.includes('full stack')
  ) {
    return {
      bg: 'rgba(168,85,247,0.14)',
      color: '#9333EA',
    };
  }

  /* ================= GREEN ================= */
  if (
    text.includes('seo') ||
    text.includes('ui') ||
    text.includes('ux')
  ) {
    return {
      bg: 'rgba(34,197,94,0.14)',
      color: '#16A34A',
    };
  }

  /* ================= BLUE ================= */
  if (
    text.includes('devops') ||
    text.includes('security') ||
    text.includes('qa') ||
    text.includes('customer success') ||
    text.includes('operations')
  ) {
    return {
      bg: 'rgba(59,130,246,0.14)',
      color: '#2563EB',
    };
  }

  /* ================= ORANGE ================= */
  if (
    text.includes('data') ||
    text.includes('process') ||
    text.includes('site reliability') ||
    text.includes('l&d') ||
    text.includes('r&d')
  ) {
    return {
      bg: 'rgba(251,146,60,0.16)',
      color: '#EA580C',
    };
  }

  /* ================= PINK ================= */
  if (
    text.includes('marketing') ||
    text.includes('branding')
  ) {
    return {
      bg: 'rgba(236,72,153,0.14)',
      color: '#DB2777',
    };
  }

  /* ================= YELLOW ================= */
  if (
    text.includes('analyst') ||
    text.includes('amount')
  ) {
    return {
      bg: 'rgba(234,179,8,0.18)',
      color: '#CA8A04',
    };
  }

  /* ================= BLACK / GRAY ================= */
  if (
    text.includes('cloud') ||
    text.includes('compliance') ||
    text.includes('contract') ||
    text.includes('procurement') ||
    text.includes('corporate') ||
    text.includes('status')
  ) {
    return {
      bg: 'rgba(0,0,0,0.08)',
      color: '#111827',
    };
  }

  /* ================= DEFAULT ================= */
  return {
    bg: 'rgba(0,152,226,0.15)',
    color: '#0698E2',
  };
};

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);

  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, staff: any) => {
    setAnchorEl(event.currentTarget);
    setSelectedStaff(staff);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStaff(null);
  };

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
      <Paper
        elevation={0}
        sx={(theme) => ({
          mt: 3,
          borderRadius: '8px',
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
          backgroundColor: theme.palette.background.paper,
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
                <TableCell sx={{ minWidth: '230px' }}>Department Name</TableCell>
                <TableCell sx={{ minWidth: '270px' }}>Positions</TableCell>
                <TableCell align="left">Actions</TableCell>
              </TableRow>
            </TableHead>

            {/* ================= TABLE BODY ================= */}
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <CircularProgress size={22} />
                  </TableCell>
                </TableRow>
              ) : departments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 260,
                        textAlign: 'center',
                        py: 2,
                      }}
                    >
                      <AccountTree
                        sx={{
                          fontSize: 80,
                          color: (theme) =>
                            theme.palette.mode === 'dark'
                              ? theme.palette.text.secondary
                              : theme.palette.grey[400],
                          mb: 2,
                        }}
                      />
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          mb: 1,
                          color: (theme) => theme.palette.text.primary,
                        }}
                      >
                        No Departments Yet
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          color: (theme) => theme.palette.text.secondary,
                          maxWidth: 480,
                        }}
                      >
                        You haven&apos;t created any departments yet. Use the &quot;Add Department&quot; button to create
                        your first department and define its positions.
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                departments.map((department, index) => (
                  <TableRow
                    key={department._id}
                    hover
                    sx={(theme) => ({
                      '& td': {
                        fontSize: 13,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      },
                      '&:hover': {
                        backgroundColor:
                          theme.palette.mode === 'dark'
                            ? '#020617'
                            : '#FAFBFF',
                      },
                    })}
                  >
                    {/* ===== Department Name ===== */}
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 3,
                            height: 22,
                            borderRadius: 1,
                            backgroundColor: [
                              '#A855F7',
                              '#3B82F6',
                              '#F59E0B',
                              '#EC4899',
                              '#22C55E',
                            ][index % 5],
                          }}
                        />
                        <Typography fontWeight={500}>
                          {department.name}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* ===== Positions ===== */}
                    <TableCell>
                      <Stack direction="row" gap={1} flexWrap="wrap">
                        {department.positions?.length ? (
                          department.positions.map((position) => {
                            const style = getPositionStyles(position.name);
                            return (
                              <Chip
                                key={position._id}
                                label={position.name}
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
                          })
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No positions
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>

                    {/* ===== Actions ===== */}
                    <TableCell align="left">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDepartment(department);
                          setAnchorEl(e.currentTarget);
                        }}
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

        {/* ================= ACTION MENU ================= */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
          <MenuItem
            onClick={() => {
              handleOpenEdit(selectedDepartment);
              setAnchorEl(null);
            }}
          >
            Edit
          </MenuItem>

          <MenuItem
            onClick={() => {
              setDeleteDialogOpen(true);
              setAnchorEl(null);
            }}
            sx={{ color: 'error.main' }}>
            Delete
          </MenuItem>
        </Menu>

      </Paper>
      {/* ================= PAGINATION ================= */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={(_, newPage) => setPage(newPage)}
          color="primary"
          showFirstButton
          showLastButton
        />
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>

        <DialogTitle sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {selectedDepartment ? 'Edit Department' : 'Add New Department'}
          <IconButton onClick={() => setDialogOpen(false)} size="small">
            <CloseOutlined />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ paddingBlock: 24 }} dividers>
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
            disabled={
              saving ||
              !departmentName.trim() ||
              positions.filter((pos) => pos.name.trim()).length === 0
            }
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
