'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
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

  let isUserInfoFetched = false;
  useEffect(() => {
    if (!isUserInfoFetched && token && !isTokenExpired(token) && !userInfo && !userInfoLoading) {
      isUserInfoFetched = true;
      dispatch(fetchUserInfo());
    }
  }, [token, userInfo, userInfoLoading, dispatch]);

  useEffect(() => {
    if (token && userInfo?.role) {
      const userRoutes = {
        Admin: adminItems.map((item) => item.key),
        Regular: regularItems.map((item) => item.key),
        Superuser: superUserItems.map((item) => item.key),
      };
      const currentUserRoutes = isSuperUser ? userRoutes.Superuser : userRoutes[userInfo?.role];

      const updatedPath = pathname.replace(/^\/dashboard\/?/, '');
      if (!currentUserRoutes.includes(updatedPath)) {
        router.push('/dashboard');
      }
    }
  }, [pathname, userInfo]);

  if (!loaded || !token) {
    return null;
  }

  return (
    <>
      {userInfoLoading ? (
        <Loader />
      ) : (
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
            }}
          >
            <BreadCrumbs />
            <Box>{children}</Box>
          </Box>
        </Box>
      )}
    </>
  );
}
