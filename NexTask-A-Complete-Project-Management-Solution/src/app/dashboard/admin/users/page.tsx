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
  Select,
  FormControl,
  InputLabel,
  Avatar,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Pagination,
} from '@mui/material';
import {
  EditOutlined,
  DeleteOutline,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentUser } from '@/redux/selectors';
import { fetchUserInfo } from '@/redux/slices';
import PageHeader from '@/components/PageHeader';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { enqueueSnackbar } from 'notistack';
import { useRouter } from 'next/navigation';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  superuser?: boolean;
  photoUrl?: string;
  createdAt?: string;
}

const AdminUsersPage: React.FC = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { data: currentUser } = useSelector(selectCurrentUser);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    // Check if user is admin
    if (currentUser && currentUser.role !== 'Admin' && !currentUser.superuser) {
      router.push('/dashboard/projects'); // Redirect to projects instead of dashboard
      return;
    }
    fetchUsers();
  }, [currentUser, router, page]);

  const fetchUsers = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get(`/api/users?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(response.data.users);
      setTotalPages(response.data.pagination?.totalPages ?? 1);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch users',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      await axios.patch(
        '/api/users',
        {
          userId: selectedUser._id,
          role: newRole,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      enqueueSnackbar({
        message: 'User role updated successfully',
        variant: 'success',
      });

      // Refresh users list
      await fetchUsers();
      setEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to update user role',
        variant: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setUpdating(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      await axios.delete(`/api/users?_id=${selectedUser._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      enqueueSnackbar({
        message: 'User deleted successfully',
        variant: 'success',
      });

      // Refresh users list
      await fetchUsers();
      setDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete user',
        variant: 'error',
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <PageHeader title="User Management" />

      <Box sx={{ mt: 3 }}>
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User';
                    return (
                      <TableRow key={user._id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              src={user.photoUrl}
                              sx={{
                                width: 40,
                                height: 40,
                                bgcolor: 'primary.main',
                              }}
                            >
                              {fullName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography variant="body2">{fullName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip
                            label={user.role || 'Regular'}
                            color={user.role === 'Admin' ? 'primary' : 'default'}
                            size="small"
                          />
                          {user.superuser && (
                            <Chip
                              label="Superuser"
                              color="secondary"
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              onClick={() => handleEditRole(user)}
                              color="primary"
                            >
                              <EditOutlined fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(user)}
                              color="error"
                              disabled={user._id === currentUser?._id?.toString()}
                            >
                              <DeleteOutline fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
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
      </Box>

      {/* Edit Role Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                User: {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="Regular">Regular</MenuItem>
                  <MenuItem value="Admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateRole}
            variant="contained"
            disabled={updating || !newRole}
            startIcon={updating && <CircularProgress size={15} color="inherit" />}
          >
            Update Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Typography>
              Are you sure you want to delete{' '}
              <strong>
                {selectedUser.firstName} {selectedUser.lastName}
              </strong>{' '}
              ({selectedUser.email})? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={updating}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteUser}
            variant="contained"
            color="error"
            disabled={updating}
            startIcon={updating && <CircularProgress size={15} color="inherit" />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminUsersPage;


