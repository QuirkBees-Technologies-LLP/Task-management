'use client';

import { ReactNode, useEffect, useRef, useState, useMemo } from 'react';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Sider from '@/components/Sider';
import DashboardAppbar from '@/components/Header/DashboardHeader';
import BreadCrumbs from '@/components/BreadCrumbs';
import { accessTokenKey, appbarHeight } from '@/utils/constants';
import { usePathname, useRouter } from 'next/navigation';
import { enqueueSnackbar } from 'notistack';
import { isTokenExpired, safeLocalStorageGet } from '@/utils/helpers';
import { selectCurrentUser, selectLoggedOut, selectSuperuser } from '@/redux/selectors';
import { useSelector } from 'react-redux';
import { fetchUserInfo } from '@/redux/slices';
import { useDispatch } from 'react-redux';
import { adminItems, regularItems, superUserItems } from '@/utils/routes';

interface LayoutProps {
  children: ReactNode;
}

export default function ProjectsLayout({ children }: LayoutProps) {
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
      !loggedOut
    ) {
      hasRedirected.current = true;
      enqueueSnackbar({
        message: 'You need to login first',
        variant: 'error',
      });
      router.push('/login');
    }
  }, [token, pathname, router, loggedOut]);

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

  if (!loaded || !token) {
    return null;
  }

  // Render UI immediately, don't block on userInfo loading
  return (
    <Box sx={{ display: 'flex' }}>
      <DashboardAppbar collapsed={collapsed} setCollapsed={setCollapsed} />
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
          mt: `${appbarHeight}px`,
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <BreadCrumbs />
        <Box sx={{ width: '100%', maxWidth: '100%' }}>{children}</Box>
      </Box>
    </Box>
  );
}

