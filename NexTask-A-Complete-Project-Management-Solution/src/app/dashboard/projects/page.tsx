'use client';
import React, { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Box,
} from '@mui/material';
import { AddOutlined, DeleteOutline, EditOutlined, MoreVert } from '@mui/icons-material';
import ProjectModal from './components/ProjectModal';
import PageHeader from '@/components/PageHeader';
import ResponsiveTable from '@/components/Table';
import ProjectDeleteDialog from './components/DeleteProject';
import { enqueueSnackbar } from 'notistack';
import { projectColumns, projectListKeys } from './helpers';
import { Project } from './types';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';

export default function Projects() {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { data: currentUser } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = currentUser?.role === 'Admin' || isSuperUser;

  const [dataSource, setDataSource] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [selectedProjectForDelete, setSelectedProjectForDelete] = useState<Project | null>(null);

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const isMenuOpen = Boolean(menuAnchorEl);

  const [projectModalVisible, setProjectModalVisible] = useState<boolean>(false);

  const [selectedProject, setSelectedProject] = useState<Project>({
    id: undefined,
    name: '',
    clientName: '',
    description: '',
    status: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await axios.get('/api/projects?limit=1000', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const convertedProjects: Project[] = (response.data.projects || []).map((p: any) => ({
          id: p._id,
          name: p.name,
          clientName: p.clientName || '',
          description: p.description,
          status: p.status || 'Pending',
          startDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
          endDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : '',
        }));
        setDataSource(convertedProjects);
      }
    } catch (error: any) {
      console.error('Error fetching projects:', error);
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to fetch projects',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMoreMenu = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
  };

  const handleDeleteProject = async () => {
    if (!selectedProjectForDelete || !selectedProjectForDelete.id) return;

    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      await axios.delete(`/api/projects/${selectedProjectForDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      enqueueSnackbar('Project deleted successfully!', { variant: 'success' });
      setDeleteOpen(false);
      setSelectedProjectForDelete(null);
      fetchProjects();
    } catch (error: any) {
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete project',
        variant: 'error',
      });
    }
  };

  return (
    <>
      <PageHeader
        title={'Projects'}
        action={
          isAdmin ? (
            <Button
              variant="contained"
              startIcon={<AddOutlined />}
              onClick={() => {
                setSelectedProject({
                  id: undefined,
                  name: '',
                  clientName: '',
                  description: '',
                  status: '',
                  startDate: '',
                  endDate: '',
                });
                setProjectModalVisible(true);
              }}
            >
              Add New
            </Button>
          ) : null
        }
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: isSmallScreen ? 2 : 0 }}>
          <ResponsiveTable
            data={dataSource}
            columns={projectColumns}
            listKeys={projectListKeys}
            renderActions={
              isAdmin
                ? (item) => (
                  <>
                    {isSmallScreen ? (
                      <>
                        <IconButton onClick={handleOpenMoreMenu} size="small">
                          <MoreVert fontSize="small" />
                        </IconButton>
                        <Menu
                          anchorEl={menuAnchorEl}
                          open={isMenuOpen}
                          onClose={handleCloseMenu}
                          anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                          }}
                          transformOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                          }}
                        >
                          <MenuItem
                            onClick={() => {
                              handleCloseMenu();
                              setProjectModalVisible(true);
                              setSelectedProject(item);
                            }}
                          >
                            <ListItemIcon>
                              <EditOutlined fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Edit</ListItemText>
                          </MenuItem>
                          <MenuItem
                            onClick={() => {
                              handleCloseMenu();
                              setSelectedProjectForDelete(item);
                              setDeleteOpen(true);
                            }}
                          >
                            <ListItemIcon>
                              <DeleteOutline fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Delete</ListItemText>
                          </MenuItem>
                        </Menu>
                      </>
                    ) : (
                      <Stack direction={'row'}>
                        <IconButton
                          onClick={() => {
                            setProjectModalVisible(true);
                            setSelectedProject(item);
                          }}
                        >
                          <EditOutlined color="primary" />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setSelectedProjectForDelete(item);
                            setDeleteOpen(true);
                          }}
                        >
                          <DeleteOutline color="warning" />
                        </IconButton>
                      </Stack>
                    )}
                  </>
                )
                : undefined
            }
          />
        </Paper>
      )}

      <ProjectModal
        visible={projectModalVisible}
        setVisible={setProjectModalVisible}
        mode={selectedProject.id ? 'edit' : 'add'}
        initialValues={selectedProject}
        setInitialValues={setSelectedProject}
        onSave={fetchProjects}
      />

      <ProjectDeleteDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onDelete={handleDeleteProject}
      />
    </>
  );
}
