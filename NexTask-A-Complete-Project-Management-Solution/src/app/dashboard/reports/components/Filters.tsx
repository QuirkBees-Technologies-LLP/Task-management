'use client';

import React, { useState } from 'react';
import { Button, Grid2, MenuItem, Paper, TextField } from '@mui/material';
import CardHeader from '@/components/CardHeader';
import { ReportFiltersProps } from '../types';

interface FilterState {
  type: 'projects' | 'tasks';
  status: 'all' | 'in_progress' | 'pending' | 'completed';
}

// ReportFilters Component
const ReportFilters: React.FC<ReportFiltersProps> = ({ onApplyFilter }) => {
  const [selectedType, setSelectedType] = useState<FilterState['type']>('projects');
  const [selectedStatus, setSelectedStatus] = useState<FilterState['status']>('all');

  const handleApplyFilters = () => {
    onApplyFilter({
      type: selectedType,
      status: selectedStatus,
    });
  };

  return (
    <Paper sx={{ mb: 2 }}>
      <CardHeader
        title={
          <Grid2 container alignItems="center" spacing={2}>
            {/* Report Type Selector */}
            <Grid2 size={{ xs: 5, md: 4 }}>
              <TextField
                select
                margin="dense"
                name="reportType"
                fullWidth
                size="small"
                label="Report Type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as FilterState['type'])}
              >
                <MenuItem value="projects">Project</MenuItem>
                <MenuItem value="tasks">Task</MenuItem>
              </TextField>
            </Grid2>

            {/* Status Selector */}
            <Grid2 size={{ xs: 5, md: 4 }}>
              <TextField
                select
                margin="dense"
                name="status"
                fullWidth
                size="small"
                label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as FilterState['status'])}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Grid2>

            {/* Apply Button */}
            <Grid2 size={{ xs: 2, md: 4 }}>
              <Button variant="contained" onClick={handleApplyFilters}>
                Apply
              </Button>
            </Grid2>
          </Grid2>
        }
      />
    </Paper>
  );
};

export default ReportFilters;
