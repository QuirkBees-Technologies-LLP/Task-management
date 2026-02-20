'use client';

import React, { useState } from 'react';
import { Box, Button, Grid2, MenuItem, Paper, TextField } from '@mui/material';
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
    // <Paper sx={{ mb: 2 }}>
    //   <CardHeader
    //     title={
    //       <Grid2 container alignItems="center" spacing={2}>
    //         {/* Report Type Selector */}
    //         <Grid2 size={{ xs: 5, md: 4 }}>
    //           <TextField
    //             select
    //             margin="dense"
    //             name="reportType"
    //             fullWidth
    //             size="small"
    //             label="Report Type"
    //             value={selectedType}
    //             onChange={(e) => setSelectedType(e.target.value as FilterState['type'])}
    //           >
    //             <MenuItem value="projects">Project</MenuItem>
    //             <MenuItem value="tasks">Task</MenuItem>
    //           </TextField>
    //         </Grid2>

    //         {/* Status Selector */}
    //         <Grid2 size={{ xs: 5, md: 4 }}>
    //           <TextField
    //             select
    //             margin="dense"
    //             name="status"
    //             fullWidth
    //             size="small"
    //             label="Status"
    //             value={selectedStatus}
    //             onChange={(e) => setSelectedStatus(e.target.value as FilterState['status'])}
    //           >
    //             <MenuItem value="all">All</MenuItem>
    //             <MenuItem value="in_progress">In Progress</MenuItem>
    //             <MenuItem value="pending">Pending</MenuItem>
    //             <MenuItem value="completed">Completed</MenuItem>
    //           </TextField>
    //         </Grid2>

    //         {/* Apply Button */}
    //         <Grid2 size={{ xs: 2, md: 4 }}>
    //           <Button variant="contained" onClick={handleApplyFilters}>
    //             Apply
    //           </Button>
    //         </Grid2>
    //       </Grid2>
    //     }
    //   />
    // </Paper>
    <Box
      sx={{
        backgroundColor: (theme) => theme.palette.background.paper,
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: "8px",
        mb: 3,
      }}
    >
      <CardHeader
        title={
          <Grid2 container alignItems="center" spacing={2}>
            {/* Report Type Selector */}
            <Grid2 size={{ xs: 12, sm: 5, md: 3 }}>
              <TextField
                select
                margin="dense"
                name="reportType"
                fullWidth
                label="Report Type"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as FilterState['type'])}
                sx={{
                  width: { xs: "100%", lg: "520px" },
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
              >
                <MenuItem value="projects">Project</MenuItem>
                <MenuItem value="tasks">Task</MenuItem>
              </TextField>
            </Grid2>

            {/* Status Selector */}
            <Grid2 size={{ xs: 12, sm: 5, md: 3 }}>
              <TextField
                select
                margin="dense"
                name="status"
                fullWidth
                label="Status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as FilterState['status'])}
                sx={{
                  width: { xs: "100%", lg: "520px" },
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
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </TextField>
            </Grid2>

            {/* Apply Button */}
            <Grid2 size={{ xs: 12, sm: 2, md: 4 }}>
              <Button variant="outlined" onClick={handleApplyFilters}
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
                }}>
                Apply
              </Button>
            </Grid2>
          </Grid2>
        }
      />
    </Box>
  );
};

export default ReportFilters;
