'use client';

import React, { useEffect, useState } from 'react';
import {
  Drawer,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  List,
  useTheme,
  useMediaQuery,
  Tooltip,
  styled,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { appbarHeight, drawerWidth, userRoles } from '@/utils/constants';
import { Scrollbar } from '../Scrollbar';
import { selectCurrentUser } from '@/redux/selectors';
import Spinner from '../Spinner';
import { useSelector } from 'react-redux';
import { adminItems, regularItems, superUserItems } from '@/utils/routes';

// Define types for the props
interface SiderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isSuperUser?: boolean;
  userRole?: string;
}

const StyledDrawer = styled(Drawer)(({ open, theme }) => ({
  '& .MuiDrawer-paper.MuiDrawer-paperAnchorLeft': {
    top: appbarHeight - 1,
    width: !open ? `calc(${theme.spacing(8)} + 20px)` : drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.easeInOut,
      duration: '0.3s',
    }),
    height: `calc(100vh - ${appbarHeight}px)`,
    overflowY: 'auto',
    borderLeft: 'none',
  },
  flexShrink: 0,
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
  overflowX: 'hidden',
  width: !open ? `calc(${theme.spacing(8)} + 20px)` : drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.easeInOut,
    duration: '0.3s',
  }),
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  margin: '5px 15px',
  '&.Mui-selected': {
    outline: `1px solid ${theme.palette.primary.main}`,
    '& .MuiListItemText-primary': {
      color: theme.palette.primary.main,
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
  },
}));

const getSiderItems = (isSuperUser, userRole) => {
  // Filter items based on user role
  if (isSuperUser) {
    return superUserItems;
  }

  if (userRole === userRoles.admin) {
    return adminItems;
  }
  if (userRole === userRoles.regular) {
    return regularItems;
  }
  return [];
};

const Sider: React.FC<SiderProps> = ({ collapsed, setCollapsed, isSuperUser, userRole }) => {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useTheme();
  const [selected, setSelected] = useState(pathname.split('/')[2] || '');
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { loading: userInfoLoading } = useSelector(selectCurrentUser);

  // Update selected item based on the current path
  useEffect(() => {
    const key = pathname.split('/')[2] || '';
    setSelected(key);
  }, [pathname]);

  const handleClick = (path) => {
    router.push(path);
    if (isSmallScreen) {
      setCollapsed(true);
    }
  };

  return (
    <StyledDrawer
      variant={isSmallScreen ? 'temporary' : 'permanent'}
      open={!collapsed}
      onClose={() => setCollapsed(true)}
    >
      <Scrollbar>
        <List>
          {/* Sidebar Items */}
          {userInfoLoading ? (
            <Spinner />
          ) : (
            getSiderItems(isSuperUser, userRole).map((item) => (
              <Tooltip key={item.key} title={collapsed ? item.title : ''} placement="right">
                <StyledListItemButton
                  key={item.key}
                  selected={selected === item.key}
                  style={{ borderRadius: theme.shape.borderRadius }}
                  onClick={() => handleClick(`/dashboard/${item.key}`)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: '32px',
                      py: 0.5,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {!collapsed && <ListItemText sx={{ py: 0, my: 0 }} primary={item.title} />}
                </StyledListItemButton>
              </Tooltip>
            ))
          )}
        </List>
      </Scrollbar>
    </StyledDrawer>
  );
};

export default Sider;
