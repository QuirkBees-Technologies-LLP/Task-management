import React from 'react';
import {
  Paper,
  Stack,
  IconButton,
  CardContent,
  Grid2,
  Typography,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { DeleteOutline, EditOutlined } from '@mui/icons-material';
import CardHeader from '@/components/CardHeader';
import { DetailsCardProps } from '../../types';

export default function DetailsCard({
  project,
  handleEdit,
  setDeleteOpen,
}: DetailsCardProps): JSX.Element {
  return (
    <Paper sx={{ mb: 2 }}>
      <CardHeader
        title="Details"
        action={
          (handleEdit || setDeleteOpen) ? (
            <Stack direction="row">
              {handleEdit && (
                <Tooltip title="Edit Project">
                  <IconButton size="small" color="primary" onClick={handleEdit}>
                    <EditOutlined />
                  </IconButton>
                </Tooltip>
              )}
              {setDeleteOpen && (
                <Tooltip title="Delete Project">
                  <IconButton size="small" color="error" onClick={setDeleteOpen}>
                    <DeleteOutline />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          ) : null
        }
      />
      <CardContent>
        <Grid2 container spacing={2} alignItems="center">
          <Grid2 size={{ xs: 6, md: 4 }}>
            <Typography variant="subtitle2">
              Start Date: <br />
              <Typography variant="caption">{project.startDate || 'N/A'}</Typography>
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 6, md: 4 }}>
            <Typography variant="subtitle2">
              End Date: <br />
              <Typography variant="caption">{project.endDate || 'N/A'}</Typography>
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle2">
              Completion: <br />
              <LinearProgress
                variant="determinate"
                value={project.progress}
                sx={{ height: 8, mt: 1 }}
              />
              <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 1 }}>
                {project.progress}%
              </Typography>
            </Typography>
          </Grid2>

          <Grid2 size={{ xs: 6, md: 4 }}>
            <Typography variant="subtitle2">
              Project Type: <br />
              <Typography variant="caption">{project.type || 'N/A'}</Typography>
            </Typography>
          </Grid2>
          <Grid2 size={{ xs: 6, md: 4 }}>
            <Typography variant="subtitle2">
              Customer: <br />
              <Typography variant="caption">{project.customer || 'N/A'}</Typography>
            </Typography>
          </Grid2>

          <Grid2 size={{ xs: 12, md: 8 }}>
            <Typography variant="subtitle2">
              Description: <br />
              <Typography variant="caption">{project.description || 'N/A'}</Typography>
            </Typography>
          </Grid2>
        </Grid2>
      </CardContent>
    </Paper>
  );
}
