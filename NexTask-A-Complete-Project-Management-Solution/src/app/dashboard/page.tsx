'use client';
import React from 'react';
import {
  CheckCircleOutline,
  GroupOutlined,
  HourglassEmpty,
  WorkOutline,
} from '@mui/icons-material';
import { Box, Button, CardContent, Grid2, Icon, Paper, Typography, useTheme } from '@mui/material';
import Link from 'next/link';
import CustomerBarChart from '@/components/CustomersChart';
import ReportsChart from '@/components/ReportsChart';
import { hexToRgbChannel, varAlpha } from '@/theme/utils';
import { blue, pink, teal, yellow } from '@mui/material/colors';
import CardHeader from '@/components/CardHeader';
import ResponsiveTable from '@/components/Table';
import { projectColumns, projectListKeys } from './projects/helpers';
import { tasks } from '@/utils/data';
import { useData } from '@/utils/hooks';

const items = [
  {
    title: 'Total Projects',
    value: '102',
    description: 'Increased by 12%',
    color: blue[700],
    icon: <WorkOutline fontSize="large" />,
  },
  {
    title: 'Active Users',
    value: '3k+',
    description: 'Gained 142 new users',
    color: pink[700],
    icon: <GroupOutlined fontSize="large" />,
  },
  {
    title: 'Completed Tasks',
    value: '7,890',
    description: 'Up by 18%',
    color: yellow[700],
    icon: <CheckCircleOutline fontSize="large" />,
  },
  {
    title: 'Pending Approvals',
    value: '58',
    description: 'Reduced by 5%',
    color: teal[700],
    icon: <HourglassEmpty fontSize="large" />,
  },
];

export default function Dashboard() {
  const theme = useTheme();
  const { data: projects, loading } = useData({ key: 'projects' });

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
                <Link href={'/dashboard/tasks'}>
                  <Button>View Tasks</Button>
                </Link>
              }
            />
            <CardContent>
              <ReportsChart data={tasks} />
            </CardContent>
          </Paper>
        </Grid2>
        <Grid2 size={{ xs: 12 }}>
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
                loading={loading}
              />
            </CardContent>
          </Paper>
        </Grid2>
      </Grid2>
    </>
  );
}
