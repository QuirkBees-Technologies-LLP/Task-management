'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircleOutline,
  GroupOutlined,
  HourglassEmpty,
  WorkOutline,
  Assignment,
} from '@mui/icons-material';
import { Box, Button, CardContent, Grid2, Icon, Paper, Typography, useTheme, CircularProgress, List, ListItem, ListItemText, ListItemIcon, Chip, Avatar, Divider } from '@mui/material';
import Link from 'next/link';
import CustomerBarChart from '@/components/CustomersChart';
import ReportsChart from '@/components/ReportsChart';
import { hexToRgbChannel, varAlpha } from '@/theme/utils';
import { blue, pink, teal, yellow } from '@mui/material/colors';
import CardHeader from '@/components/CardHeader';
import ResponsiveTable from '@/components/Table';
import { projectColumns, projectListKeys } from './projects/helpers';
import axios from 'axios';
import { safeLocalStorageGet } from '@/utils/helpers';
import { accessTokenKey } from '@/utils/constants';

// Dashboard page is commented out - redirecting to projects instead
// All dashboard functionality should be accessed through /dashboard/projects
export default function Dashboard() {
  const router = useRouter();
  
  // Immediately redirect to projects - Dashboard page should not be accessible
  useEffect(() => {
    router.push('/dashboard/projects');
  }, [router]);

  // Return null or a loading state while redirecting
  return null;
  
  /* COMMENTED OUT - Dashboard page content - redirecting to projects instead
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [activity, setActivity] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchActivity();
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/projects?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setProjects(response.data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchActivity = async () => {
    try {
      const token = safeLocalStorageGet(accessTokenKey);
      if (!token) return;

      const response = await axios.get('/api/activity', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setActivity(response.data.activity || []);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setActivityLoading(false);
    }
  };

  const items = [
    {
      title: 'Total Users',
      value: statsLoading ? '...' : stats.totalUsers.toString(),
      description: '',
      color: blue[700],
      icon: <GroupOutlined fontSize="large" />,
    },
    {
      title: 'Total Projects',
      value: statsLoading ? '...' : stats.totalProjects.toString(),
      description: '',
      color: teal[700],
      icon: <WorkOutline fontSize="large" />,
    },
    {
      title: 'Completed Tasks',
      value: statsLoading ? '...' : stats.completedTasks.toString(),
      description: '',
      color: yellow[700],
      icon: <CheckCircleOutline fontSize="large" />,
    },
    {
      title: 'Pending Tasks',
      value: statsLoading ? '...' : stats.pendingTasks.toString(),
      description: '',
      color: pink[700],
      icon: <HourglassEmpty fontSize="large" />,
    },
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Grid2 container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {items.map((item) => (
          <Grid2 size={{ xs: 12, sm: 6, md: 3 }} key={item.title}>
            <Paper
              sx={{
                outline: '2px solid',
                outlineColor: varAlpha(hexToRgbChannel(item.color), 0.6),
                boxShadow: 'none',
                backgroundColor: varAlpha(hexToRgbChannel(item.color), 0.1),
              }}
            >
              <CardHeader
                title={<Typography variant="h5">{item.value}</Typography>}
                action={
                  <Paper sx={{ px: 1, py: 0.5, bgcolor: item.color }}>
                    <Icon fontSize="large" sx={{ color: theme.palette.background.default }}>
                      {item.icon}
                    </Icon>
                  </Paper>
                }
              />
              <CardContent sx={{ pt: 0 }} style={{ paddingBottom: 16 }}>
                <Box pb={0}>
                  <Typography variant="subtitle1">{item.title}</Typography>
                </Box>
              </CardContent>
            </Paper>
          </Grid2>
        ))}
        <Grid2 size={{ xs: 12, md: 8 }}>
          <Paper sx={{ height: 400 }}>
            <CardHeader
              title="Total Customers"
              action={
                <Link href={'/dashboard/clients'}>
                  <Button>View Customers</Button>
                </Link>
              }
            />
            <CardContent>
              <CustomerBarChart />
            </CardContent>
          </Paper>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <Paper sx={{ height: 400 }}>
            <CardHeader
              title="Tasks"
              action={
                <Link href={'/dashboard/projects'}>
                  <Button>View Projects</Button>
                </Link>
              }
            />
            <CardContent>
              <ReportsChart data={[]} />
            </CardContent>
          </Paper>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 8 }}>
          <Paper sx={{ minHeight: 160 }}>
            <CardHeader
              title="Popular Projects"
              action={
                <Link href="dashboard/projects">
                  <Button>View Projects</Button>
                </Link>
              }
            />
            <CardContent>
              <ResponsiveTable
                data={projects}
                columns={projectColumns}
                listKeys={projectListKeys}
                loading={projectsLoading}
              />
            </CardContent>
          </Paper>
        </Grid2>
        <Grid2 size={{ xs: 12, md: 4 }}>
          <Paper sx={{ minHeight: 400 }}>
            <CardHeader title="Recent Activity" />
            <CardContent>
              {activityLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : activity.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No recent activity
                </Typography>
              ) : (
                <List>
                  {activity.slice(0, 5).map((item, index) => (
                    <React.Fragment key={index}>
                      <ListItem>
                        <ListItemIcon>
                          {item.type === 'task' ? (
                            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                              <Assignment fontSize="small" />
                            </Avatar>
                          ) : (
                            <Avatar sx={{ bgcolor: theme.palette.secondary.main, width: 32, height: 32 }}>
                              <WorkOutline fontSize="small" />
                            </Avatar>
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Typography variant="body2" fontWeight={500}>
                              {item.type === 'task' ? item.title : item.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ mt: 0.5 }}>
                              <Typography variant="caption" color="text.secondary">
                                {item.type === 'task' ? 'Task' : 'Project'} • {formatDate(item.updatedAt || item.createdAt)}
                              </Typography>
                              {item.type === 'task' && item.status && (
                                <Chip
                                  label={item.status}
                                  size="small"
                                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < activity.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Paper>
        </Grid2>
      </Grid2>
    </>
  );
  */
}
