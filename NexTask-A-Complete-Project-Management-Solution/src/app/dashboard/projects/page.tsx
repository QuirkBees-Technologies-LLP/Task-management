'use client';
import React, { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Box,
  Grid2,
  Typography,
  Chip,
  Card,
  CardContent,
  CardActionArea,
} from '@mui/material';
import { AddOutlined, DeleteOutline, EditOutlined, InfoOutlined, MoreVert } from '@mui/icons-material';
import ProjectModal from './components/ProjectModal';
import PageHeader from '@/components/PageHeader';
import ProjectDeleteDialog from './components/DeleteProject';
import { enqueueSnackbar } from 'notistack';
import { Project } from './types';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectSuperuser } from '@/redux/selectors';

interface ProjectWithStats extends Project {
  taskCount?: number;
  completedTasks?: number;
  pendingTasks?: number;
}

export default function Projects() {
  const router = useRouter();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { data: currentUser } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const isAdmin = currentUser?.role === 'Admin' || isSuperUser;

  const [dataSource, setDataSource] = useState<ProjectWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [selectedProjectForDelete, setSelectedProjectForDelete] = useState<Project | null>(null);

  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuProjectId, setMenuProjectId] = React.useState<string | null>(null);
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
    assignee: [],
    attachments: [],
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
        const projects: ProjectWithStats[] = (response.data.projects || []).map((p: any) => ({
          id: p._id,
          name: p.name,
          clientName: p.clientName || '',
          description: p.description,
          status: p.status || 'Pending',
          startDate: p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : '',
          endDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : '',
          assignee: Array.isArray(p.assignee)
            ? p.assignee.map((id: any) => (typeof id === 'string' ? id : id?.toString() || ''))
            : [],
          attachments: Array.isArray(p.attachments) ? p.attachments : [],
        }));

        // Fetch task counts for each project
        const projectsWithStats = await Promise.all(
          projects.map(async (project) => {
            try {
              const tasksResponse = await axios.get(`/api/projects/${project.id}/tasks?limit=1000`, {
                headers: { Authorization: `Bearer ${token}` },
              });

              if (tasksResponse.data.success) {
                const tasks = tasksResponse.data.tasks || [];
                const completedTasks = tasks.filter((t: any) => 
                  t.status === 'completed' || t.status === 'Done'
                ).length;
                const pendingTasks = tasks.filter((t: any) => 
                  t.status === 'pending' || t.status === 'Todo'
                ).length;

                return {
                  ...project,
                  taskCount: tasks.length,
                  completedTasks,
                  pendingTasks,
                };
              }
            } catch (error) {
              console.error(`Error fetching tasks for project ${project.id}:`, error);
            }
            return {
              ...project,
              taskCount: 0,
              completedTasks: 0,
              pendingTasks: 0,
            };
          })
        );

        setDataSource(projectsWithStats);
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

  const handleOpenMoreMenu = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
    event.stopPropagation(); // Prevent card click
    setMenuAnchorEl(event.currentTarget);
    setMenuProjectId(projectId);
  };

  const handleCloseMenu = () => {
    setMenuAnchorEl(null);
    setMenuProjectId(null);
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
      handleCloseMenu();
      fetchProjects();
    } catch (error: any) {
      enqueueSnackbar({
        message: error.response?.data?.error || 'Failed to delete project',
        variant: 'error',
      });
    }
  };

  const handleDetailsClick = (projectId: string | number | undefined, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    if (!projectId) return;
    router.push(`/projects/${projectId}/full-details`);
    handleCloseMenu();
  };

  const handleCardClick = (projectId: string | number | undefined) => {
    if (projectId) {
      router.push(`/projects/${projectId}/tasks`);
    }
  };

  const handleEditClick = (project: Project, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedProject(project);
    setProjectModalVisible(true);
    handleCloseMenu();
  };

  const handleDeleteClick = (project: Project, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setSelectedProjectForDelete(project);
    setDeleteOpen(true);
    handleCloseMenu();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Pending':
        return 'default';
      default:
        return 'default';
    }
  };

  const getCardColor = (index: number) => {
    const colors = [
      theme.palette.primary.light,
      theme.palette.secondary.light,
      theme.palette.info.light,
      theme.palette.success.light,
      theme.palette.warning.light,
      theme.palette.error.light,
    ];
    return colors[index % colors.length];
  };

  // Strip basic HTML tags from rich text descriptions for card preview
  const getPlainTextDescription = (html?: string) => {
    if (!html) return '';
    try {
      // Remove HTML tags
      const withoutTags = html.replace(/<[^>]+>/g, ' ');
      // Collapse whitespace and trim
      return withoutTags.replace(/\s+/g, ' ').trim();
    } catch {
      return html;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateString;
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
              Add Project
            </Button>
          ) : null
        }
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
          <CircularProgress />
        </Box>
      ) : dataSource.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No projects found
          </Typography>
          {isAdmin && (
            <Button
              variant="outlined"
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
              sx={{ mt: 2 }}
            >
              Create Your First Project
            </Button>
          )}
        </Paper>
      ) : (
        <Grid2 container spacing={3}>
          {dataSource.map((project, index) => (
            <Grid2 key={project.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                  borderTop: `4px solid ${getCardColor(index)}`,
                }}
              >
                <CardActionArea
                  onClick={() => handleCardClick(project.id)}
                  sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
                >
                  <CardContent sx={{ flex: 1, p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{
                          fontWeight: 600,
                          fontSize: '1.1rem',
                          lineHeight: 1.3,
                          flex: 1,
                          pr: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {project.name || 'Unnamed Project'}
                      </Typography>
                      {isAdmin && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMoreMenu(e, String(project.id))}
                          sx={{
                            ml: 0.5,
                            '&:hover': {
                              backgroundColor: theme.palette.action.hover,
                            },
                          }}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>

                    {project.clientName && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1.5, fontWeight: 500 }}
                      >
                        {project.clientName}
                      </Typography>
                    )}

                    {project.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mb: 2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          minHeight: '2.5em',
                        }}
                      >
                        {getPlainTextDescription(project.description)}
                      </Typography>
                    )}

                    <Stack spacing={1.5} sx={{ mt: 'auto' }}>
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Chip
                          label={project.status || 'Pending'}
                          color={getStatusColor(project.status || 'Pending') as any}
                          size="small"
                          sx={{ fontSize: '0.75rem', height: 24 }}
                        />
                      </Stack>

                      <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                        {project.taskCount !== undefined && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Tasks
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {project.taskCount}
                            </Typography>
                          </Box>
                        )}
                        {project.completedTasks !== undefined && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Completed
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="success.main">
                              {project.completedTasks}
                            </Typography>
                          </Box>
                        )}
                        {project.pendingTasks !== undefined && (
                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Pending
                            </Typography>
                            <Typography variant="body2" fontWeight={600} color="warning.main">
                              {project.pendingTasks}
                            </Typography>
                          </Box>
                        )}
                      </Stack>

                      {(project.startDate || project.endDate) && (
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          {project.startDate && (
                            <Typography variant="caption" color="text.secondary">
                              Start: {formatDate(project.startDate)}
                            </Typography>
                          )}
                          {project.endDate && (
                            <Typography variant="caption" color="text.secondary">
                              End: {formatDate(project.endDate)}
                            </Typography>
                          )}
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={isMenuOpen}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={(e) => {
            const project = dataSource.find((p) => String(p.id) === menuProjectId);
            if (project) handleDetailsClick(project.id, e);
          }}
        >
          <ListItemIcon>
            <InfoOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Project Details</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            const project = dataSource.find((p) => String(p.id) === menuProjectId);
            if (project) handleEditClick(project, e);
          }}
        >
          <ListItemIcon>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={(e) => {
            const project = dataSource.find((p) => String(p.id) === menuProjectId);
            if (project) handleDeleteClick(project, e);
          }}
        >
          <ListItemIcon>
            <DeleteOutline fontSize="small" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

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
