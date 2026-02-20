import React, { useState, MouseEvent } from 'react';
import Logo from '@/components/Logo';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Badge,
  Menu,
  Tooltip,
  Avatar,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Button,
  Typography,
  useTheme,
  useMediaQuery,
  useColorScheme,
  Chip,
} from '@mui/material';
import {
  NotificationsOutlined,
  MenuOpen,
  DarkModeOutlined,
  SettingsOutlined,
  Logout,
  Key,
  LightMode,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

import Notifications from '@/app/dashboard/notifications/components/NotificationList';
import SettingsDrawer from './SettingsDrawer';
import { appbarHeight, drawerWidth } from '@/utils/constants';
import { logout } from '@/redux/slices';
import { useDispatch } from 'react-redux';
import { selectCurrentUser, selectNotifications, selectSuperuser } from '@/redux/selectors';
import { useSelector } from 'react-redux';

// Define types for the props
interface DashboardAppbarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  pageTitle?: string;
  breadcrumbs?: React.ReactNode;
  breadcrumbsPlacement?: 'below' | 'inline';
}

const DashboardAppbar: React.FC<DashboardAppbarProps> = ({
  collapsed,
  setCollapsed,
  pageTitle,
  breadcrumbs,
  breadcrumbsPlacement = 'below',
}) => {
  const dispatch = useDispatch();
  const theme = useTheme();
  const { mode, setMode } = useColorScheme();
  const router = useRouter();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isXsScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { data: userInfo } = useSelector(selectCurrentUser);
  const { data: notifications } = useSelector(selectNotifications);
  const isSuperUser = useSelector(selectSuperuser);

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [notifAnchor, setNotifAnchor] = useState<null | HTMLElement>(null);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const notificationsOpen = Boolean(notifAnchor);
  const profileOpen = Boolean(profileAnchor);

  // Handle opening the notification menu
  const handleOpenNotifMenu = (event: MouseEvent<HTMLElement>) => {
    setNotifAnchor(event.currentTarget);
  };

  // Handle closing the notification menu
  const handleCloseNotifMenu = () => {
    setNotifAnchor(null);
  };

  // Handle opening the profile menu
  const handleOpenProfileMenu = (event: MouseEvent<HTMLElement>) => {
    setProfileAnchor(event.currentTarget);
  };

  // Handle closing the profile menu
  const handleCloseProfileMenu = () => {
    setProfileAnchor(null);
  };

  const handleLogout = async () => {
    dispatch(logout());
  };

  return (
    <>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{
          height: appbarHeight,
          zIndex: theme.zIndex.drawer + 1,
          borderRight: 0,
          borderLeft: 0,
          borderTop: 0,
        }}
      >
        <Toolbar
          sx={{
            height: appbarHeight,
            position: 'relative',
          }}
        >
          {/* Left: align with sidebar width on desktop so title starts at content edge */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: {xs: "15px", md: "32px"},
              // width: isSmallScreen
              //   ? 'auto'
              //   : collapsed
              //     ? (theme) => `calc(${theme.spacing(8)} + 20px)`
              //     : `${drawerWidth}px`,
            }}
          >
            <Box>
              <Logo />
            </Box>
            <Tooltip title={collapsed ? 'Open Menu' : 'Collapse Menu'}>
              <IconButton onClick={() => setCollapsed(!collapsed)}
                sx={{
                  backgroundColor: (theme) =>
                    theme.palette.mode === "dark"
                      ? theme.palette.background.default
                      : "#F9FAFC",

                  border: (theme) =>
                    `1px solid ${theme.palette.mode === "dark"
                      ? theme.palette.divider
                      : "#E5E7EB"
                    }`,
                }}
              >
                <MenuOpen
                  sx={{
                    transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: (theme) =>
                      theme.transitions.create('transform', {
                        duration: theme.transitions.duration.short,
                        easing: theme.transitions.easing.easeIn,
                      }),
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>
          <Box
            sx={{
              flexGrow: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              pl: '24px',
            }}
          >
            {pageTitle && breadcrumbs && breadcrumbsPlacement === 'inline' ? (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, minWidth: 0 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.1, flexShrink: 0 }}
                >
                  {pageTitle}
                </Typography>
                <Box sx={{ minWidth: 0 }}>{breadcrumbs}</Box>
              </Box>
            ) : (
              <>
                <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                  {pageTitle && (
                    <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.1 }}>
                      {pageTitle}
                    </Typography>
                  )}
                  {breadcrumbs && <Box sx={{ mt: pageTitle ? 0.25 : 0 }}>{breadcrumbs}</Box>}
                </Box>
              </>
            )}
          </Box>
          <Box sx={{ marginLeft: 'auto' }}>
            {!isXsScreen && (
              <Tooltip title="Dark mode">
                <IconButton onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
                  {mode === 'dark' ? <LightMode /> : <DarkModeOutlined />}
                </IconButton>
              </Tooltip>
            )}
            {/* {!isSmallScreen && (
              <Tooltip title="Settings">
                <IconButton onClick={() => setSettingsOpen(true)}>
                  <SettingsOutlined />
                </IconButton>
              </Tooltip>
            )} */}
            {!isSmallScreen && (
              <Tooltip title="Profile Settings">
                <IconButton onClick={() => router.push('/dashboard/settings')} sx={{ ml: 1 }}>
                  <SettingsOutlined />
                </IconButton>
              </Tooltip>
            )}
            {!isXsScreen && (
              <Tooltip title="Notifications">
                <IconButton onClick={handleOpenNotifMenu}>
                  <Badge
                    badgeContent={notifications?.filter((item) => !item?.read).length}
                    color="primary"
                  >
                    <NotificationsOutlined />
                  </Badge>
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Profile">
              <IconButton onClick={handleOpenProfileMenu}>
                <Avatar src={userInfo?.photoUrl}>{userInfo?.firstName?.charAt(0)}</Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Menu
        id="notifications"
        anchorEl={notifAnchor}
        open={notificationsOpen}
        onClose={handleCloseNotifMenu}
        slotProps={{ paper: { sx: { width: 400 } } }}
      >
        <Notifications />
      </Menu>
      <Menu
        id="profile"
        anchorEl={profileAnchor}
        open={profileOpen}
        onClose={handleCloseProfileMenu}
        sx={{ width: 300 }}
        slotProps={{ paper: { sx: { width: 300 } } }}
      >
        <Box px={2}>
          <ListItemText
            primary={
              <Box display="flex" alignItems="center" justifyContent={'space-between'}>
                {userInfo?.firstName} {userInfo?.lastName}
                <Chip
                  label={isSuperUser ? 'Super Admin' : userInfo?.role}
                  color="success"
                  variant="outlined"
                />
              </Box>
            }
            primaryTypographyProps={{ variant: 'button' }}
            secondary={userInfo?.email}
            secondaryTypographyProps={{ variant: 'caption' }}
          />
        </Box>
        <Divider />
        <Box my={2}>
          <MenuItem
            key={'settings'}
            onClick={() => {
              router.push('/dashboard/settings');
              setProfileAnchor(null);
            }}
          >
            <ListItemIcon>
              <SettingsOutlined />
            </ListItemIcon>
            <ListItemText>Profile Settings</ListItemText>
          </MenuItem>
          {isXsScreen && (
            <>
              <MenuItem
                key={'settings'}
                onClick={() => {
                  setSettingsOpen(true);
                  setProfileAnchor(null);
                }}
              >
                <ListItemIcon>
                  <DarkModeOutlined />
                </ListItemIcon>
                <ListItemText>Theme Settings</ListItemText>
              </MenuItem>
              <MenuItem
                key={'settings'}
                onClick={() => {
                  router.push('/dashboard/notifications');
                  setProfileAnchor(null);
                }}
              >
                <ListItemIcon>
                  <NotificationsOutlined />
                </ListItemIcon>
                <ListItemText>Notifications</ListItemText>
              </MenuItem>
            </>
          )}
          <MenuItem
            key={'password'}
            onClick={() => {
              router.push('/change-password');
              setProfileAnchor(null);
            }}
          >
            <ListItemIcon>
              <Key />
            </ListItemIcon>
            <ListItemText>Change Password</ListItemText>
          </MenuItem>
        </Box>
        <Box mx={2} mb={2}>
          <Button
            fullWidth
            color="error"
            variant="outlined"
            startIcon={<Logout />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Box>
      </Menu>
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};

export default DashboardAppbar;
