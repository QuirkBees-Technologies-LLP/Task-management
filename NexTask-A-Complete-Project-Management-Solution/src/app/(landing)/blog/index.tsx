'use client';

import React from 'react';
import Link from 'next/link';
import { Box, Grid2, Link as MuiLink, Typography, useMediaQuery, useTheme } from '@mui/material';
import { gradientAnimation } from '../home/helpers';
import AnimatedComponent from '@/components/Animated';
import BlogPost from './components/BlogPost';

export default function Blog() {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  return (
    <Box>
      <Grid2 container justifyContent="center">
        <Grid2 size={{ xs: 12, sm: 12, md: 9 }}>
          <Box sx={{ mt: { xs: 2, md: 4 } }} textAlign="center">
            <AnimatedComponent animationType="slideLeft">
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '8vw', md: '4.5rem' },
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.primary.light})`,
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  animation: `${gradientAnimation} 4s ease infinite`,
                  lineHeight: 1.3,
                }}
              >
                Blog
              </Typography>
            </AnimatedComponent>
            <AnimatedComponent animationType="slideRight">
              <Typography variant={isSmallScreen ? 'caption' : 'body1'}>
                Our insights on project management, software solutions, and the future of work.
              </Typography>
            </AnimatedComponent>
          </Box>
        </Grid2>
      </Grid2>

      <Box py={6}>
        <MuiLink component={Link} href={'/blog/our-insights-project-management'}>
          <BlogPost
            title="Mastering Project Management: Tips, Tools, and Strategies for Success"
            description="Unlock the secrets to effective project management with our latest
              blog. Discover essential tools, proven methodologies, and expert
              tips to streamline workflows, boost collaboration, and achieve
              your goals. Whether you're leading a small team or managing
              large-scale projects, this guide will help you stay on track and
              deliver results with confidence"
            date={'18/09/2024'}
            image={'/images/blog-post.jpg'}
            extra={'5 min read'}
            isPrimary
          />
        </MuiLink>
      </Box>

      <Box py={6}>
        <Typography variant="h3" gutterBottom>
          Recent Posts
        </Typography>
        <Grid2 container spacing={3} justifyContent={'center'} sx={{ mt: 2 }}>
          {Array.from({ length: 6 }).map((_, idx) => (
            <Grid2 size={{ xs: 10, sm: 6, md: 4 }} key={idx}>
              <MuiLink component={Link} href={'/blog/our-insights-project-management'}>
                <BlogPost
                  title="Mastering Project Management: Tips, Tools, and Strategies for Success"
                  description="Unlock the secrets to effective project management with our latest
              blog. Discover essential tools, proven methodologies, and expert
              tips to streamline workflows, boost collaboration."
                  date={'18/09/2024'}
                  image={'/images/blog-post.jpg'}
                  extra={'5 min read'}
                />
              </MuiLink>
            </Grid2>
          ))}
        </Grid2>
      </Box>
    </Box>
  );
}
