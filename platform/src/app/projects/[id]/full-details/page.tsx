'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamicImport from 'next/dynamic';
import {
  Box,
  CircularProgress,
  Container,
  Grid2,
  Link as MuiLink,
  Paper,
  Tab,
  Tabs,
  Typography,
  Stack,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  AttachFile,
  CalendarToday,
  PersonOutline,
  Description as DescriptionIcon,
  ViewModule,
  ViewList,
} from '@mui/icons-material';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';
import PageHeader from '@/components/PageHeader';
import type { TaskAttachment } from '@/app/dashboard/tasks/types';

export const dynamic = 'force-dynamic';

type TabKey = 'overview' | 'tasks' | 'team';

// Import TaskBoard for read-only display (no edit/delete/add functionality)
const TaskBoard = dynamicImport(
  () => import('@/app/dashboard/tasks/components/TaskBoard'),
  { ssr: false }
);
const TaskListView = dynamicImport(
  () => import('@/app/dashboard/tasks/components/TaskListView'),
  { ssr: false }
);

interface ProjectResponseProject {
  _id: string;
  name?: string;
  clientName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
   createdAt?: string;
  status?: string;
  assignee?: string[] | any[];
  attachments?: TaskAttachment[];
}

interface UserSummary {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  position?: string; // Department position (e.g., "Full Stack Developer")
  departmentId?: string;
  positionId?: string;
}

function formatDate(dateString?: string) {
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
}

function getPlainTextFromHtml(html?: string) {
  if (!html) return '';
  try {
    const withoutTags = html.replace(/<[^>]+>/g, ' ');
    return withoutTags.replace(/\s+/g, ' ').trim();
  } catch {
    return html;
  }
}

export default function ProjectFullDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string | undefined;

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loadingProject, setLoadingProject] = useState(true);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [project, setProject] = useState<ProjectResponseProject | null>(null);

  const [loadingTasks, setLoadingTasks] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [taskView, setTaskView] = useState<'board' | 'list'>('board');

  const [loadingTeam, setLoadingTeam] = useState(false);
  const [team, setTeam] = useState<UserSummary[]>([]);
  const [teamLoaded, setTeamLoaded] = useState(false);

  useEffect(() => {
    if (!projectId) {
      router.replace('/dashboard/projects');
      return;
    }

    const fetchProject = async () => {
      setLoadingProject(true);
      setProjectError(null);
      try {
        const token = safeLocalStorageGet(accessTokenKey);
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await axios.get(`/api/projects/${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data?.success && response.data.project) {
          setProject(response.data.project as ProjectResponseProject);
        } else {
          setProjectError(response.data?.error || 'Failed to load project');
        }
      } catch (error: any) {
        // If access is denied, behave like the tasks page and send user back
        if (error.response?.status === 403) {
          router.push('/dashboard/projects');
          return;
        }
        setProjectError(error.response?.data?.error || 'Failed to load project');
      } finally {
        setLoadingProject(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: TabKey) => {
    setActiveTab(newValue);
  };

  const projectTitle = project?.name || 'Project Details';

  const displayStartDate = useMemo(() => {
    // Prefer explicit startDate; fallback to createdAt so users always see something
    const start = project?.startDate || project?.createdAt;
    return start ? formatDate(start) : 'Not set';
  }, [project?.startDate, project?.createdAt]);

  const displayEndDate = useMemo(() => {
    const end = project?.endDate || project?.dueDate;
    return end ? formatDate(end) : 'Not set';
  }, [project?.endDate, project?.dueDate]);

  const attachments: TaskAttachment[] = useMemo(() => {
    return Array.isArray(project?.attachments) ? project!.attachments! : [];
  }, [project?.attachments]);

  const handleLoadTeam = async () => {
    if (!project || teamLoaded || loadingTeam) return;

    const assigneeIdsRaw = project.assignee || [];
    const assigneeIds = Array.isArray(assigneeIdsRaw)
      ? assigneeIdsRaw
          .map((id: any) => (typeof id === 'string' ? id : id?._id?.toString?.() || id?.toString?.() || ''))
          .filter(Boolean)
      : [];

    if (assigneeIds.length === 0) {
      setTeamLoaded(true);
      setTeam([]);
      return;
    }

    setLoadingTeam(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) {
        router.push('/login');
        return;
      }

      // Fetch users and departments to get position names
      const [usersResponse, departmentsResponse] = await Promise.all([
        axios.get('/api/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get('/api/departments?limit=1000', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const allUsers: any[] = Array.isArray(usersResponse.data) ? usersResponse.data : [];
      const departments: any[] = departmentsResponse.data?.success
        ? departmentsResponse.data.departments || []
        : [];

      // Build a map of departmentId -> positions map
      const departmentsMap = new Map<string, Map<string, string>>();
      departments.forEach((dept) => {
        const deptId = typeof dept._id === 'string' ? dept._id : dept._id?.toString?.() || '';
        const positionsMap = new Map<string, string>();
        if (Array.isArray(dept.positions)) {
          dept.positions.forEach((pos: any) => {
            const posId = pos._id?.toString?.() || pos.id?.toString?.() || '';
            const posName = pos.name || '';
            if (posId && posName) {
              positionsMap.set(posId, posName);
            }
          });
        }
        departmentsMap.set(deptId, positionsMap);
      });

      // Filter and map users with their positions
      const matchedUsers: UserSummary[] = allUsers
        .filter((u) => assigneeIds.includes(typeof u._id === 'string' ? u._id : u._id?.toString?.()))
        .map((u) => {
          const userData: UserSummary = {
            _id: typeof u._id === 'string' ? u._id : u._id?.toString?.() || '',
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
          };

          // Get position from department/position structure
          if (u.departmentId && u.positionId) {
            const deptId = typeof u.departmentId === 'string' ? u.departmentId : u.departmentId?.toString?.() || '';
            const posId = typeof u.positionId === 'string' ? u.positionId : u.positionId?.toString?.() || '';
            const positionsMap = departmentsMap.get(deptId);
            if (positionsMap) {
              const positionName = positionsMap.get(posId);
              if (positionName) {
                userData.position = positionName;
              }
            }
          }

          return userData;
        });

      setTeam(matchedUsers);
    } catch (error) {
      console.error('Error fetching team members for project:', error);
      setTeam([]);
    } finally {
      setLoadingTeam(false);
      setTeamLoaded(true);
    }
  };

  // No-op handlers for read-only task display
  const handleReadOnlyTaskEdit = () => {
    // Read-only: do nothing
  };
  const handleReadOnlyTaskDelete = () => {
    // Read-only: do nothing
  };
  const handleReadOnlyTaskAdd = () => {
    // Read-only: do nothing
  };
  const handleReadOnlyRefresh = () => {
    // Read-only: do nothing
  };

  useEffect(() => {
    if (activeTab === 'tasks') {
      // Tasks are loaded by TaskBoard component itself, no need to fetch here
      setTasksLoaded(true);
    } else if (activeTab === 'team') {
      handleLoadTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  if (!projectId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadingProject) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (projectError || !project) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <PageHeader title="Project Details" />
        <Paper sx={{ p: 4, mt: 2 }}>
          <Typography color="error" variant="body1">
            {projectError || 'Project not found'}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title={projectTitle}
        action={
          <Chip
            label={project.status || 'Pending'}
            color={(project.status === 'Completed'
              ? 'success'
              : project.status === 'In Progress'
              ? 'warning'
              : 'default') as any}
            size="small"
          />
        }
      />

      <Paper sx={{ mt: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="Project details tabs"
        >
          <Tab label="Overview" value="overview" />
          <Tab label="Tasks" value="tasks" />
          <Tab label="Team" value="team" />
        </Tabs>
      </Paper>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <Grid2 container spacing={3} sx={{ mt: 2 }}>
          <Grid2 size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <DescriptionIcon fontSize="small" color="primary" />
                <Typography variant="h6">Project Description</Typography>
              </Stack>
              {project.description ? (
                <Box
                  sx={{
                    '& p': { mb: 1.2 },
                    color: 'text.secondary',
                    fontSize: 14,
                  }}
                  // Render the rich text as HTML as it is stored from the editor
                  dangerouslySetInnerHTML={{ __html: project.description }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No description provided.
                </Typography>
              )}
            </Paper>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Project Details
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <PersonOutline fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Client
                    </Typography>
                    <Typography variant="body2">
                      {project.clientName || 'Not set'}
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarToday fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Start Date
                    </Typography>
                    <Typography variant="body2">{displayStartDate}</Typography>
                  </Box>
                </Stack>

                <Stack direction="row" spacing={1} alignItems="center">
                  <CalendarToday fontSize="small" color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      End Date
                    </Typography>
                    <Typography variant="body2">{displayEndDate}</Typography>
                  </Box>
                </Stack>
              </Stack>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="h6">Attachments</Typography>
                <Chip
                  size="small"
                  label={`${attachments.length} item${attachments.length === 1 ? '' : 's'}`}
                  variant="outlined"
                />
              </Stack>
              {attachments.length > 0 ? (
                <List dense>
                  {attachments.map((attachment, index) => (
                    <ListItem key={`${attachment.fileUrl}-${index}`} sx={{ px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <AttachFile fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <MuiLink
                            href={attachment.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{
                              fontSize: 13,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            {attachment.fileName || 'Attachment'}
                          </MuiLink>
                        }
                        secondary={
                          attachment.fileType ? (
                            <Typography variant="caption" color="text.secondary">
                              {attachment.fileType}
                            </Typography>
                          ) : null
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No attachments for this project.
                </Typography>
              )}
            </Paper>
          </Grid2>
        </Grid2>
      )}

      {/* Tasks Tab - Read-only task board/list view */}
      {activeTab === 'tasks' && projectId && (
        <Paper sx={{ p: 2, mt: 2, overflowX: 'hidden', width: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">Project Tasks</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mr: 1 }}>
               
              </Typography>
              <ToggleButtonGroup
                value={taskView}
                exclusive
                onChange={(_, newView) => {
                  if (newView !== null) {
                    setTaskView(newView);
                  }
                }}
                size="small"
              >
                <ToggleButton value="board" aria-label="Board view">
                  <Tooltip title="Board View">
                    <ViewModule fontSize="small" />
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="list" aria-label="List view">
                  <Tooltip title="List View">
                    <ViewList fontSize="small" />
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
            </Stack>
          </Stack>
          <Divider sx={{ mb: 2 }} />
          {taskView === 'board' ? (
            <TaskBoard
              projectId={projectId}
              refreshBoard={handleReadOnlyRefresh}
              onEditTask={handleReadOnlyTaskEdit}
              onDeleteTask={handleReadOnlyTaskDelete}
              onAddTask={handleReadOnlyTaskAdd}
            />
          ) : (
            <TaskListView
              projectId={projectId}
              refreshBoard={handleReadOnlyRefresh}
              onEditTask={handleReadOnlyTaskEdit}
              onDeleteTask={handleReadOnlyTaskDelete}
            />
          )}
        </Paper>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Project Team
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {loadingTeam ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress size={24} />
            </Box>
          ) : team.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No team members assigned to this project.
            </Typography>
          ) : (
            <List>
              {team.map((member) => (
                <React.Fragment key={member._id}>
                  <ListItem sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <PersonOutline />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2">
                          {`${member.firstName || ''} ${member.lastName || ''}`.trim() ||
                            member.email ||
                            'Unnamed User'}
                        </Typography>
                      }
                      secondary={
                        <Stack direction="row" spacing={2} flexWrap="wrap">
                          {member.email && (
                            <Typography variant="caption" color="text.secondary">
                              {member.email}
                            </Typography>
                          )}
                          {member.position && (
                            <Typography variant="caption" color="text.secondary">
                              {member.position}
                            </Typography>
                          )}
                        </Stack>
                      }
                    />
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Container>
  );
}


