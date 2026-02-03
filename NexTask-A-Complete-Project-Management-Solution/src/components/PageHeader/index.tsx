import React from 'react';
import { Box, CardHeader, CardHeaderPropsWithComponent, Typography, Stack } from '@mui/material';
import { usePathname } from 'next/navigation';
import BreadCrumbs from '@/components/BreadCrumbs';

// Extract getPageTitle logic to match layout.tsx
const getPageTitle = (path: string, providedTitle?: string): string => {
  // If title is explicitly provided, use it
  if (providedTitle) {
    return providedTitle;
  }

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
  };

  // Handle nested admin routes like /dashboard/admin/departments
  if (baseRoute === 'admin') {
    const adminTitleMap: Record<string, string> = {
      departments: 'Department',
      users: 'Users',
    };
    return adminTitleMap[subRoute] || 'Admin';
  }

  // Handle nested routes like /dashboard/projects/[id]/tasks
  // Check if there's a nested route that has a title mapping
  // Skip IDs (MongoDB ObjectId, numeric, or UUID-like patterns)
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

export default function PageHeader({ title, ...props }: CardHeaderPropsWithComponent) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  // Also handle /projects/[id]/tasks paths (project tasks pages)
  const isProjectTasksPage = pathname?.match(/^\/projects\/[^/]+\/tasks/);

  // For dashboard pages, don't show title/breadcrumbs here - they're in the global header/navbar
  // Only show action buttons if provided
  if (isDashboard) {
    if (props.action) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          {props.action}
        </Box>
      );
    }
    return null;
  }

  // For project tasks pages (non-dashboard), show title and breadcrumbs inside the page
  if (isProjectTasksPage) {
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
                Projects
              </Typography>
              <BreadCrumbs mb={0} inDashboard={false} />
            </Stack>
          </Box>
          {props.action && (
            <Box sx={{ ml: 2, flexShrink: 0 }}>
              {props.action}
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  // For non-dashboard pages, use the original CardHeader behavior
  return (
    <CardHeader
      {...props}
      title={title}
      sx={{
        px: 0,
        ['& .MuiCardHeader-action']: {
          mr: 0,
        },
      }}
      titleTypographyProps={{ variant: 'h5', sx: { m: 0, fontSize: '1.5rem' } }}
    />
  );
}
