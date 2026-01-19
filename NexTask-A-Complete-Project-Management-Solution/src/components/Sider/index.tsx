'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  Collapse,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import { usePathname, useRouter } from 'next/navigation';
import { appbarHeight, drawerWidth, userRoles } from '@/utils/constants';
import { Scrollbar } from '../Scrollbar';
import { selectCurrentUser } from '@/redux/selectors';
import Spinner from '../Spinner';
import { useSelector } from 'react-redux';
import { adminItems, regularItems, superUserItems, superUserItemsWithAdmin } from '@/utils/routes';

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

const StyledNestedListItemButton = styled(ListItemButton)(({ theme }) => ({
  margin: '2px 15px 2px 40px',
  paddingLeft: theme.spacing(3),
  '&.Mui-selected': {
    outline: `1px solid ${theme.palette.primary.main}`,
    backgroundColor: theme.palette.action.selected,
    '& .MuiListItemText-primary': {
      color: theme.palette.primary.main,
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
  },
}));

const getSiderItems = (isSuperUser, userRole) => {
  // Filter items based on user role
  if (isSuperUser) {
    return superUserItemsWithAdmin;
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
  // Get the route key from pathname (handle nested routes like admin/departments)
  const getRouteKey = (path: string) => {
    const parts = path.replace('/dashboard/', '').split('/');
    return parts.length > 1 ? parts.join('/') : parts[0] || '';
  };
  const [selected, setSelected] = useState(getRouteKey(pathname));
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [navigating, setNavigating] = useState(false);
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { loading: userInfoLoading } = useSelector(selectCurrentUser);

  // Memoize sider items to prevent recalculation on every render
  const siderItems = useMemo(() => {
    return getSiderItems(isSuperUser, userRole);
  }, [isSuperUser, userRole]);

  // Update selected item based on the current path
  useEffect(() => {
    const key = getRouteKey(pathname);
    setSelected(key);
    setNavigating(false); // Reset navigating state when pathname changes
    
    // Auto-expand parent menu if child is selected
    siderItems.forEach((item) => {
      if ('children' in item && item.children) {
        const hasSelectedChild = item.children.some((child) => child.key === key);
        if (hasSelectedChild) {
          setOpenMenus((prev) => {
            // Only update if not already open to prevent unnecessary re-renders
            if (prev[item.key]) return prev;
            return { ...prev, [item.key]: true };
          });
        }
      }
    });
  }, [pathname, siderItems]);

  const handleClick = useCallback((path: string) => {
    // Prevent multiple rapid clicks
    if (navigating || pathname === path) {
      return;
    }

    setNavigating(true);
    
    // Navigate immediately
    router.push(path);
    
    if (isSmallScreen) {
      setCollapsed(true);
    }

    // Reset navigating state after navigation completes (pathname will change)
    // No need for timeout as pathname change will reset it
  }, [navigating, pathname, router, isSmallScreen, setCollapsed]);

  const handleMenuToggle = useCallback((key: string) => {
    setOpenMenus((prev) => {
      // Only update if state actually changes
      if (prev[key] === undefined) {
        return { ...prev, [key]: true };
      }
      return { ...prev, [key]: !prev[key] };
    });
  }, []);

  const renderMenuItem = useCallback(
    (item: any) => {
      const hasChildren = item.children && item.children.length > 0;
      const isOpen = openMenus[item.key] || false;
      const isSelected = selected === item.key || (hasChildren && item.children.some((child: any) => child.key === selected));

      if (hasChildren) {
        return (
          <React.Fragment key={item.key}>
            <Tooltip title={collapsed ? item.title : ''} placement="right">
              <StyledListItemButton
                selected={isSelected}
                style={{ borderRadius: theme.shape.borderRadius }}
                onClick={() => {
                  if (!collapsed) {
                    handleMenuToggle(item.key);
                  }
                }}
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
                {!collapsed && (isOpen ? <ExpandLess /> : <ExpandMore />)}
              </StyledListItemButton>
            </Tooltip>
            <Collapse in={isOpen && !collapsed} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {item.children.map((child: any) => {
                  const isChildSelected = selected === child.key;
                  return (
                    <Tooltip key={child.key} title={collapsed ? child.title : ''} placement="right">
                      <StyledNestedListItemButton
                        selected={isChildSelected}
                        style={{ borderRadius: theme.shape.borderRadius }}
                        onClick={() => handleClick(`/dashboard/${child.key}`)}
                      >
                        <ListItemIcon
                          sx={{
                            minWidth: '32px',
                            py: 0.5,
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        {!collapsed && <ListItemText sx={{ py: 0, my: 0 }} primary={child.title} />}
                      </StyledNestedListItemButton>
                    </Tooltip>
                  );
                })}
              </List>
            </Collapse>
          </React.Fragment>
        );
      }

      return (
        <Tooltip key={item.key} title={collapsed ? item.title : ''} placement="right">
          <StyledListItemButton
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
      );
    },
    [collapsed, selected, openMenus, theme, handleClick, handleMenuToggle]
  );

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
            siderItems.map((item) => renderMenuItem(item))
          )}
        </List>
      </Scrollbar>
    </StyledDrawer>
  );
};

export default Sider;
