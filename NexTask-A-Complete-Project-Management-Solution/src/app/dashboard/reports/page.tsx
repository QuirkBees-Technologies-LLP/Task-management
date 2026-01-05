'use client';

import React, { useState } from 'react';
import { Grid2, Paper, CardContent, Box, useTheme, useMediaQuery, capitalize } from '@mui/material';
import dynamic from 'next/dynamic';

import ReportFilters from './components/Filters';
import TaskCompletionChart from './components/CompletionChart';
import ReportsChart from '@/components/ReportsChart';
import CardHeader from '@/components/CardHeader';
import PageHeader from '@/components/PageHeader';
import ResponsiveTable from '@/components/Table';

import { mockData } from '@/utils/constants';
import { projectColumns, projectListKeys } from '../projects/helpers';
import { taskColumns, taskListKeys } from '../tasks/helpers';
import { Project, ResponsiveTableColumn as ProjectColumn } from '../projects/types';
import { Task, ResponsiveTableColumn as TaskColumn } from '../tasks/types';
import { FilterState } from './types';

// Dynamically imported ExportOptions (client-side only)
const ExportOptions = dynamic(() => import('./components/ExportOptions'), {
  ssr: false,
});

// Main Reports Component
export default function Reports() {
  // Theme and responsive helpers
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  // State variables
  const [dataSource, setDataSource] = useState<Project[] | Task[]>(mockData.projects);
  const [columns, setColumns] = useState<ProjectColumn[] | TaskColumn[]>(projectColumns);
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    type: 'projects',
  });

  // Title based on filter type
  const title = capitalize(filters.type);

  // Handle filter application
  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);

    // Update data source and columns based on filter type
    const updatedData = mockData[newFilters.type];
    const updatedColumns = newFilters.type === 'projects' ? projectColumns : taskColumns;

    setDataSource(updatedData);
    setColumns(updatedColumns);
  };

  return (
    <>
      {/* Page Header with Export Options */}
      <PageHeader
        title="Reports"
        action={<ExportOptions title={title} data={dataSource} columns={columns} />}
      />

      {/* Filters Section */}
      <ReportFilters onApplyFilter={handleApplyFilters} />

      {/* Content Grid */}
      <Grid2 container spacing={2}>
        {/* Task Completion Chart */}
        <Grid2 size={{ xs: 12, sm: 7, md: 8 }}>
          <Paper sx={{ height: 380 }}>
            <CardHeader title={`${title} Completion Rate`} />
            <CardContent>
              <TaskCompletionChart data={dataSource} />
            </CardContent>
          </Paper>
        </Grid2>

        {/* Reports Status Chart */}
        <Grid2 size={{ xs: 12, sm: 5, md: 4 }}>
          <Paper sx={{ height: 380 }}>
            <CardHeader title={`${title} Status`} />
            <CardContent>
              <ReportsChart data={dataSource} />
            </CardContent>
          </Paper>
        </Grid2>

        {/* Responsive Table */}
        <Grid2 size={{ xs: 12 }}>
          <Paper>
            <CardHeader title={title} />
            <Box sx={{ px: isSmallScreen ? 2 : 0 }}>
              <ResponsiveTable
                data={dataSource}
                columns={columns}
                listKeys={filters.type === 'projects' ? projectListKeys : taskListKeys}
              />
            </Box>
          </Paper>
        </Grid2>
      </Grid2>
    </>
  );
}
