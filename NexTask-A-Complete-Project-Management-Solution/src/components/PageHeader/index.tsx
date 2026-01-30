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

  return titleMap[baseRoute] || 'Dashboard';
};

export default function PageHeader({ title, ...props }: CardHeaderPropsWithComponent) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');
  // Also handle /projects/[id]/tasks paths (project tasks pages)
  const isProjectTasksPage = pathname?.match(/^\/projects\/[^/]+\/tasks/);

  // For dashboard pages and project tasks pages, show title and breadcrumbs inside the page
  if (isDashboard || isProjectTasksPage) {
    // For project tasks pages, always use "Projects" as the title
    const pageTitle = isProjectTasksPage 
      ? 'Projects'
      : getPageTitle(pathname, title as string);
    
    return (
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Stack spacing={1} sx={{ flex: 1 }}>
            {pageTitle && (
              <Typography variant="h5" sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
                {pageTitle}
              </Typography>
            )}
            <BreadCrumbs mb={0} inDashboard={isDashboard} />
          </Stack>
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
