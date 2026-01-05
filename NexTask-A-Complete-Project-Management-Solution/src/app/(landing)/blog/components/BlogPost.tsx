import React from 'react';
import Image from 'next/image';
import {
  Paper,
  CardContent,
  Grid2,
  Box,
  Chip,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { getPostImageHeight } from '../helpers';

export default function BlogPost({ isPrimary = false, title, description, image, date, extra }) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Paper
      sx={{
        ':hover': {
          cursor: 'pointer',
          boxShadow: (theme) => theme.shadows[20],
        },
      }}
      variant="elevation"
    >
      <CardContent>
        <Grid2 container>
          <Grid2 size={!isPrimary ? 12 : { xs: 12, sm: 12, md: 6 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Image
                src={image}
                alt="analytics"
                priority
                width={2000}
                height={
                  isSmallScreen
                    ? getPostImageHeight(400, 200, isPrimary)
                    : getPostImageHeight(300, 200, isPrimary)
                }
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: theme.shape.borderRadius,
                }}
              />
            </Box>
          </Grid2>
          <Grid2 size={!isPrimary ? 12 : { xs: 12, sm: 12, md: 6 }}>
            <Box display={'flex'} flexDirection={'column'} justifyContent={'center'} height="100%">
              <Chip label="Resourcing & Managing" sx={{ mb: 2, width: 180 }} color="primary" />
              <Typography variant="h5" gutterBottom>
                {title}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                {description}
              </Typography>
              <Typography variant="caption">
                {date} | {extra}
              </Typography>
            </Box>
          </Grid2>
        </Grid2>
      </CardContent>
    </Paper>
  );
}
