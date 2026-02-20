'use client';

import { ReactNode, useEffect, useRef, useState, useMemo } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sider from '@/components/Sider';
import DashboardAppbar from '@/components/Header/DashboardHeader';
import BreadCrumbs from '@/components/BreadCrumbs';
import SubHeader from '@/components/SubHeader';
import { accessTokenKey, appbarHeight } from '@/utils/constants';
import { usePathname, useRouter } from 'next/navigation';
import { enqueueSnackbar } from 'notistack';
import { isTokenExpired, safeLocalStorageGet } from '@/utils/helpers';
import { selectCurrentUser, selectLoggedOut, selectSuperuser } from '@/redux/selectors';
import { useSelector } from 'react-redux';
import { fetchUserInfo } from '@/redux/slices';
import { useDispatch } from 'react-redux';
import { adminItems, regularItems, superUserItems } from '@/utils/routes';
import Loader from '@/components/Loader';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const dispatch = useDispatch();
  const router = useRouter();
  const theme = useTheme();
  const token = safeLocalStorageGet(accessTokenKey);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const pathname = usePathname();

  const hasRedirected = useRef(false);
  const isUserInfoFetched = useRef(false);

  const [collapsed, setCollapsed] = useState(isSmallScreen);
  const [loaded, setLoaded] = useState(false);

  const { data: userInfo, loading: userInfoLoading } = useSelector(selectCurrentUser);
  const isSuperUser = useSelector(selectSuperuser);
  const loggedOut = useSelector(selectLoggedOut);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    setCollapsed(isSmallScreen);
  }, [isSmallScreen]);

  useEffect(() => {
    if (
      (!token || isTokenExpired(token)) &&
      !hasRedirected.current &&
      typeof window !== 'undefined' &&
      window.location.pathname.includes('dashboard') &&
      !loggedOut
    ) {
      hasRedirected.current = true; // Prevent duplicate calls
      enqueueSnackbar({
        message: 'You need to login first',
        variant: 'error',
      });
      router.push('/login');
    }
  }, [token, pathname]);

  useEffect(() => {
    if (!isUserInfoFetched.current && token && !isTokenExpired(token) && !userInfo && !userInfoLoading) {
      isUserInfoFetched.current = true;
      dispatch(fetchUserInfo());
    }
  }, [token, userInfo, userInfoLoading, dispatch]);

  // Memoize user routes to prevent recalculation on every render
  const userRoutes = useMemo(() => {
    if (!userInfo?.role) return null;
    
    return {
      Admin: adminItems.map((item) => item.key),
      Regular: regularItems.map((item) => item.key),
      Superuser: superUserItems.map((item) => item.key),
    };
  }, [userInfo?.role]);

  const currentUserRoutes = useMemo(() => {
    if (!userInfo?.role || !userRoutes) return null;
    return isSuperUser ? userRoutes.Superuser : userRoutes[userInfo.role];
  }, [userInfo?.role, isSuperUser, userRoutes]);

  // Immediate redirect for /dashboard - don't wait for userInfo
  useEffect(() => {
    if (token && pathname === '/dashboard') {
      router.push('/dashboard/projects');
    }
  }, [token, pathname, router]);

  useEffect(() => {
    // Use a timeout to debounce route validation and prevent blocking navigation
    const timeoutId = setTimeout(() => {
      if (token && userInfo?.role && currentUserRoutes) {
        // Redirect /dashboard to /dashboard/projects (backup check)
        if (pathname === '/dashboard') {
          router.push('/dashboard/projects');
          return;
        }

        // Check if user is trying to access admin routes
        if (pathname.startsWith('/dashboard/admin') || pathname.startsWith('/admin')) {
          // Only allow Admin or Superuser to access admin routes
          if (userInfo.role !== 'Admin' && !isSuperUser) {
            enqueueSnackbar({
              message: 'Access denied. Admin privileges required.',
              variant: 'error',
            });
            router.push('/dashboard/projects'); // Redirect to projects instead of dashboard
            return;
          }
        }

        const updatedPath = pathname.replace(/^\/dashboard\/?/, '');
        // Skip route check for admin paths (already handled above)
        // Allow dynamic routes (e.g., invoices/[id], projects/[id], etc.)
        const pathParts = updatedPath.split('/').filter(Boolean);
        const baseRoute = pathParts[0] || '';

        // Check if the base route is allowed (this allows sub-routes like invoices/[id])
        // Only redirect if it's not a dynamic route and not in allowed routes
        if (!updatedPath.startsWith('admin') && baseRoute && !currentUserRoutes.includes(baseRoute)) {
          // Allow dynamic routes - check if second part looks like an ID (UUID, ObjectId, or numeric)
          // This allows routes like: invoices/123, projects/abc123, tasks/507f1f77bcf86cd799439011
          const secondPart = pathParts[1] || '';
          const isDynamicRoute = secondPart && (
            /^[a-f0-9]{24}$/i.test(secondPart) || // MongoDB ObjectId
            /^\d+$/.test(secondPart) || // Numeric ID
            /^[a-z0-9-]+$/i.test(secondPart) // Alphanumeric with dashes (UUID-like)
          );
          
          // Also allow routes that are sub-routes of valid base routes (e.g., projects/123/edit)
          const isSubRoute = pathParts.length > 1 && currentUserRoutes.includes(baseRoute);
          
          if (!isDynamicRoute && !isSubRoute) {
            router.push('/dashboard/projects'); // Redirect to projects instead of dashboard
          }
        }
      }
    }, 100); // Small delay to allow navigation to proceed first

    return () => clearTimeout(timeoutId);
  }, [pathname, userInfo, isSuperUser, router, currentUserRoutes, token]);

  if (!loaded || !token) {
    return null;
  }

  // Determine page title based on pathname - always return a title (never null)
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
    // This ensures nested routes like /dashboard/projects/[id]/tasks show "Tasks" not "Projects"
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

  const currentPageTitle = getPageTitle(pathname);
  
  // Determine breadcrumb placement - always show breadcrumbs below title (like projects layout)
  const breadcrumbsPlacement = 'below';

  // Calculate sub-header height (title + breadcrumbs + padding)
  // This is approximate - adjust based on actual rendered height
  const subHeaderHeight = 100; // Approximate height including padding

  // Render UI immediately, don't block on userInfo loading
  // User info will populate when ready (non-blocking)
  return (
    <Box sx={{ display: 'flex' }}>
      <DashboardAppbar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        pageTitle={currentPageTitle}
        breadcrumbs={<BreadCrumbs mb={0} />}
        breadcrumbsPlacement={breadcrumbsPlacement}
      />
      <SubHeader collapsed={collapsed} />
      <Sider
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isSuperUser={isSuperUser}
        userRole={userInfo?.role}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          mt: `${appbarHeight + subHeaderHeight}px`,
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: '100%' }}>{children}</Box>
      </Box>
    </Box>
  );
}
