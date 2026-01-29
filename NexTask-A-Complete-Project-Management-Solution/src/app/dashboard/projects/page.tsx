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
  Divider,
  AvatarGroup,
  Avatar,
  Grid,
} from '@mui/material';
import { AddOutlined, CalendarMonthOutlined, DeleteOutline, EditOutlined, InfoOutlined, MoreVert, TaskOutlined } from '@mui/icons-material';
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
  const getStatusStyles = (status) => {
    switch (status) {
      case "In Progress":
        return {
          bg: "rgba(255, 165, 0, 0.15)", // orange soft
          color: "#FF9800",
        };

      case "Completed":
        return {
          bg: "rgba(34, 197, 94, 0.15)", // green soft
          color: "#22C55E",
        };

      case "Planning":
        return {
          bg: "rgba(124, 77, 255, 0.15)", // purple soft
          color: "#7C4DFF",
        };

      default:
        return {
          bg: "rgba(107, 114, 128, 0.15)", // gray fallback
          color: "#6B7280",
        };
    }
  };

  const getStatusLineColor = (status) => {
    switch (status) {
      case "Completed":
        return "#22C55E"; // green
      case "In Progress":
        return "#FF9800"; // orange
      case "Planning":
        return "#7C4DFF"; // purple
      default:
        return "#CBD5E1"; // gray fallback
    }
  };

  const getPriorityStyles = (priority) => {
    switch (priority) {
      case "High":
        return {
          bg: "rgba(255, 59, 59, 0.12)", // red soft
          color: "#FF3B3B",
        };
      case "Medium":
        return {
          bg: "rgba(255, 165, 0, 0.15)", // orange soft
          color: "#FF9800",
        };
      case "Low":
        return {
          bg: "rgba(34, 197, 94, 0.15)", // green soft
          color: "#22C55E",
        };
      default:
        return {
          bg: "rgba(107, 114, 128, 0.15)", // gray fallback
          color: "#6B7280",
        };
    }
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
            <Grid2 key={project.id} size={{ xs: 12, sm: 6, xl: 4 }}>
              <Card
                sx={{
                  borderRadius: '8px',
                  border: "1px solid rgba(255,255,255,0.12)",
                  position: "relative",
                  overflow: "hidden",
                  transition: "all 0.25s ease",
                }}
              >
                {/* Left Color Bar */}
                <Box
                  sx={{
                    position: "absolute",
                    left: 18,
                    top: 18,
                    bottom: 16,
                    width: 4,
                    height: '40px',
                    borderRadius: 2,
                    backgroundColor: getStatusLineColor(project.status),
                  }}
                />

                <CardActionArea
                  onClick={() => handleCardClick(project.id)}
                >
                  <CardContent sx={{ padding: "18px !important", }}>
                    {/* Header */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Box sx={{ pl: "12px" }}>
                        <Typography fontWeight={600} fontSize="16px">
                          {project.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            height: "40px",
                            fontSize: '13px',
                            mt: 0,
                          }}
                        >
                          {getPlainTextDescription(project.description)}
                        </Typography>
                      </Box>

                      <Chip
                        label={project.status || "In Progress"}
                        size="small"
                        sx={{
                          backgroundColor: getStatusStyles(project.status || "In Progress").bg,
                          color: getStatusStyles(project.status || "In Progress").color,
                          fontWeight: 500,
                          minWidth: "fit-content",
                          borderRadius: "4px",
                          fontSize: "12px",
                        }}
                      />

                    </Stack>
                    {/* Deadline */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1} mt={2}>
                      <Box direction="row" alignItems="center" display="flex" gap={1}>
                        <CalendarMonthOutlined fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Deadline: {formatDate(project.endDate)}
                        </Typography>
                      </Box>
                      {isAdmin && (
                        <IconButton
                          size="small"
                          sx={{ ml: "auto" }}
                          onClick={(e) => handleOpenMoreMenu(e, String(project.id))}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      )}
                    </Stack>

                    {/* Members + Tasks */}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mt={2}>
                      <AvatarGroup max={3}>
                        <Avatar src="/avatar1.png" sx={{ width: 24, height: 24 }} />
                        <Avatar src="/avatar2.png" sx={{ width: 24, height: 24 }} />
                        <Avatar src="/avatar3.png" sx={{ width: 24, height: 24 }} />
                      </AvatarGroup>

                      <Stack direction="row" spacing={1} alignItems="center">
                        <TaskOutlined fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {project.taskCount} tasks
                        </Typography>
                      </Stack>
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    {/* Bottom Info Grid */}
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Client
                        </Typography>
                        <Typography fontWeight={500} fontSize={14}>
                          {project.clientName || "—"}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Start Date
                        </Typography>
                        <Typography fontWeight={500} fontSize={14}>
                          {formatDate(project.startDate)}
                        </Typography>
                      </Grid>

                      <Grid item xs={6}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Priority
                          </Typography>
                          {(() => {
                            const priorityStyle = getPriorityStyles(project.priority || "High");
                            return (
                              <Chip
                                label={project.priority || "High"}
                                size="small"
                                sx={{
                                  backgroundColor: priorityStyle.bg,
                                  color: priorityStyle.color,
                                  fontWeight: 500,
                                  minWidth: "fit-content",
                                  width: "fit-content",
                                  borderRadius: "4px",
                                  fontSize: "12px",
                                }}
                              />
                            );
                          })()}

                        </Box>
                      </Grid>
                    </Grid>
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
