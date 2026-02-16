'use client';

import React from 'react';
import Image from 'next/image';
import { Box, Chip, Divider, Grid2, Typography, useTheme } from '@mui/material';
import DynamicBreadcrumbs from '@/components/BreadCrumbs';
import BlogContent from '../components/BlogContent';

export default function BlogPost() {
  const theme = useTheme();
  return (
    <Box>
      <Box pt={2} mb={2}>
        <DynamicBreadcrumbs inDashboard={false} />
        <Divider />
      </Box>

      <Box py={4}>
        <Grid2 container spacing={4}>
          <Grid2 size={{ xs: 12, sm: 12, md: 6 }}>
            <Box display={'flex'} flexDirection={'column'} justifyContent={'center'} height="100%">
              <Chip label="Resourcing & Managing" sx={{ mb: 2, width: 180 }} color="primary" />
              <Typography variant="h3" gutterBottom>
                Mastering Project Management: Tips, Tools, and Strategies for Success
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                {`Unlock the secrets to effective project management with our
                latest blog. Discover essential tools, proven methodologies, and
                expert tips to streamline workflows, boost collaboration, and
                achieve your goals. Whether you're leading a small team or
                managing large-scale projects, this guide will help you stay on
                track and deliver results with confidence`}
              </Typography>
              <Box mt={4}>
                <Typography variant="caption">By NexTask team on 10/09/2024 | 5min read</Typography>
              </Box>
            </Box>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 12, md: 6 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Image
                src={'/images/blog-post.jpg'}
                alt="analytics"
                priority
                width={2000}
                height={400}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: theme.shape.borderRadius,
                }}
              />
            </Box>
          </Grid2>
        </Grid2>
      </Box>

      <Box py={8}>
        <BlogContent />
      </Box>
    </Box>
  );
}
