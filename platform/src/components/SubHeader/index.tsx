'use client';

import React from 'react';
import { Box, Typography, Stack, useTheme, useMediaQuery } from '@mui/material';
import { usePathname } from 'next/navigation';
import BreadCrumbs from '@/components/BreadCrumbs';
import { appbarHeight, drawerWidth } from '@/utils/constants';

// Extract getPageTitle logic to match layout.tsx
const getPageTitle = (path: string): string => {
  const pathParts = path.replace(/^\/dashboard\/?/, '').split('/').filter(Boolean);
  const baseRoute = pathParts[0] || '';
  const subRoute = pathParts[1] || '';

  const titleMap: Record<string, string> = {
    projects: 'Projects',
    tasks: 'Tasks',
    invoices: 'Invoices',
    team: 'Staff Management',
    reports: 'Reports',
    settings: 'Settings',
    notifications: 'Notifications',
    calendar: 'Calendar',
    contracts: 'Contracts',
    clients: 'Client Management',
    'email-templates': 'Email Templates',
    permissions: 'Roles & Permissions',
    support: 'Support',
    feedback: 'Feedback',
    charts: 'Charts',
    organization: 'Organization',
  };

  // Handle nested admin routes like /dashboard/admin/departments
  if (baseRoute === 'admin') {
    const adminTitleMap: Record<string, string> = {
      departments: 'Department',
      users: 'Users',
    };
    return adminTitleMap[subRoute] || 'Admin';
  }

  // Check if we're on a nested route like /dashboard/projects/[id]/tasks
  const isIdPattern = (str: string) => {
    return (
      /^[a-f0-9]{24}$/i.test(str) || // MongoDB ObjectId
      /^\d+$/.test(str) || // Numeric ID
      /^[a-z0-9-]{36}$/i.test(str) // UUID-like
    );
  };

  // Look for nested routes (e.g., projects/[id]/tasks)
  // Start from the end and work backwards to find the first non-ID segment that has a title mapping
  for (let i = pathParts.length - 1; i >= 0; i--) {
    const segment = pathParts[i];
    // If this segment is not an ID and has a title mapping, use it
    if (segment && !isIdPattern(segment) && titleMap[segment]) {
      return titleMap[segment];
    }
  }

  // Fall back to base route title
  return titleMap[baseRoute] || 'Dashboard';
};

interface SubHeaderProps {
  collapsed?: boolean;
}

export default function SubHeader({ collapsed = false }: SubHeaderProps) {
  const pathname = usePathname();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isDashboard = pathname?.startsWith('/dashboard');

  // Only show sub-header for dashboard pages
  if (!isDashboard) {
    return null;
  }

  const pageTitle = getPageTitle(pathname);

  // Calculate left margin based on sidebar state
  const leftMargin = isSmallScreen ? 0 : (collapsed ? 80 : drawerWidth);

  return (
    <Box
      className="sub-header-xs"
      sx={{
        position: 'fixed',
        display: { xs: 'block', md: 'none' },
        top: `${appbarHeight}px`,
        left: `${leftMargin}px`,
        right: 0,
        zIndex: (theme) => theme.zIndex.drawer - 1,
        backgroundColor: (theme) => theme.palette.background.paper,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        px: { xs: 2, sm: 3, md: 4 },
        py: 2,
        transition: (theme) =>
          theme.transitions.create('left', {
            duration: theme.transitions.duration.enteringScreen,
            easing: theme.transitions.easing.easeOut,
          }),
      }}
    >
      <Box>
        <Stack spacing={1}>
          {pageTitle && (
            <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.5rem', color: 'text.primary' }}>
              {pageTitle}
            </Typography>
          )}
          <BreadCrumbs mb={0} inDashboard={isDashboard} />
        </Stack>
      </Box>
    </Box>
  );
}

