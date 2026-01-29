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
  Paper,
  Typography,
  Stack,
  Box,
  Chip,
} from '@mui/material';
import {
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import ArrowRightAltIcon from "@mui/icons-material/ArrowRightAlt";
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
const projects = [
  {
    name: "Figma Design System",
    status: "Progress",
    color: "rgba(139, 92, 246, 1)",
    bg: "rgba(139, 92, 246, 0.08)",
  },
  {
    name: "Keep React",
    status: "Planning",
    color: "rgba(59, 130, 246, 1)",
    bg: "rgba(59, 130, 246, 0.06)",
  },
  {
    name: "StaticMania",
    status: "Progress",
    color: "rgba(34, 197, 94, 1)",
    bg: "rgba(34, 197, 94, 0.08)",
  },
  {
    name: "PHP Laravel",
    status: "Progress",
    color: "rgba(139, 92, 246, 1)",
    bg: "rgba(139, 92, 246, 0.08)",
  },
  {
    name: "React Native",
    status: "Planning",
    color: "rgba(59, 130, 246, 1)",
    bg: "rgba(59, 130, 246, 0.06)",
  },
  {
    name: "Task Management",
    status: "Completed",
    color: "rgba(245, 158, 11, 1)",
    bg: "rgba(245, 158, 11, 0.10)",
  },
  {
    name: "Social Media",
    status: "Progress",
    color: "rgba(34, 197, 94, 1)",
    bg: "rgba(34, 197, 94, 0.08)",
  },
  {
    name: "Mobile App",
    status: "Completed",
    color: "rgba(245, 158, 11, 1)",
    bg: "rgba(245, 158, 11, 0.10)",
  },
];


const statusChip = (status) => {
  switch (status) {
    case "Progress":
      return {
        bg: "rgba(251, 140, 0, 0.15)",
        color: "rgba(251, 140, 0, 1)",
      };
    case "Planning":
      return {
        bg: "rgba(124, 77, 255, 0.15)",
        color: "rgba(124, 77, 255, 1)",
      };
    case "Completed":
      return {
        bg: "rgba(34, 197, 94, 0.15)",
        color: "rgba(34, 197, 94, 1)",
      };
    default:
      return {};
  }
};

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
  margin: "8px 14px",
  borderRadius: "5px !important",
  outline: "1px solid",
  outlineColor: theme.palette.mode === "dark" ? "#2A2F3A" : "#F5F5F5",

  /* Text */
  "& .MuiListItemText-primary": {
    color: theme.palette.mode === "dark"
      ? "#FFFFFF"
      : "#2A2A2A",
    fontWeight: 500,
  },

  /* Icon */
  "& .MuiListItemIcon-root": {
    color: theme.palette.mode === "dark"
      ? "#FFFFFF"
      : "#2A2A2A",
  },

  /* Hover */
  "&:hover": {
    backgroundColor: theme.palette.mode === "dark"
      ? "#111827"
      : "#F9FAFC",
  },

  /* Selected */
  "&.Mui-selected": {
    background: "linear-gradient(90deg, #005B8E 0%, #03D7FE 100%)",
    color: "#fff",

    /* Fake gradient border (correct way) */
    position: "relative",
    outline: "none",
    "&::before": {
      content: '""',
      position: "absolute",
      inset: 0,
      padding: "1px",
      borderRadius: "5px",
      background: "linear-gradient(90deg, #005B8E 0%, #03D7FE 100%)",
      WebkitMask:
        "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
      WebkitMaskComposite: "xor",
      maskComposite: "exclude",
      pointerEvents: "none",
    },

    "& .MuiListItemText-primary": {
      color: "#fff",
    },
    "& .MuiListItemIcon-root": {
      color: "#fff",
    },
  },
}));

const StyledNestedListItemButton = styled(ListItemButton)(({ theme }) => ({
  margin: '2px 15px 2px 40px',
  paddingLeft: theme.spacing(3),
  '&.Mui-selected': {
    // outline: `1px solid ${theme.palette.primary.main}`,
    // backgroundColor: theme.palette.action.selected,
    '& .MuiListItemText-primary': {
      color: theme.palette.primary.main,
    },
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
    '&:hover': {
      backgroundColor: 'theme.palette.action.selected',
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
    <StyledDrawer className='sidebar_design'
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
        <Box sx={{
          px: '14px',
          my: '20px',
        }}>
          {/* Title */}
          <Typography
            variant="subtitle2"
            sx={{
              letterSpacing: "0.12em",
              color: "text.secondary",
              mb: 2,
            }}
          >
            LATEST PROJECTS
          </Typography>

          {/* List */}
          <Stack spacing={1}>
            {projects.map((item, index) => {
              const chip = statusChip(item.status);

              return (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: '8px',
                    py: '8px',
                    borderRadius: '5px',
                    backgroundColor: item.bg,
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  {/* Left Color Bar */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 8,
                      bottom: 8,
                      height: 25,
                      width: 2,
                      borderRadius: 1,
                      backgroundColor: item.color,
                    }}
                  />

                  {/* Project Name */}
                  <Typography
                    fontWeight={500}
                    fontSize={13}
                    noWrap
                    sx={{
                      maxWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </Typography>


                  {/* Status */}
                  <Chip
                    label={item.status}
                    size="small"
                    sx={{
                      backgroundColor: chip.bg,
                      color: chip.color,
                      fontWeight: 500,
                      minWidth: 'fit-content !important',
                      borderRadius: '4px',
                      fontSize: '12px',
                    }}
                  />
                </Box>
              );
            })}
          </Stack>

          {/* Footer */}
          <Box
            sx={(theme) => ({
              mt: 1,
              px: "8px",
              py: "8px",
              borderRadius: "5px",
              border: "1px solid",
              borderColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.08)"
                  : "#EEF0F4",
              backgroundColor:
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.03)"
                  : "#FAFAFA",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              cursor: "pointer",
              transition: "all 0.2s ease",

              "&:hover": {
                backgroundColor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.06)"
                    : "#F5F7FB",
              },
            })}
          >
            <Typography
              fontWeight={500}
              fontSize={13}
              sx={(theme) => ({
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.7)"
                    : theme.palette.text.secondary,
              })}
            >
              View all Project
            </Typography>

            <ArrowRightAltIcon
              sx={(theme) => ({
                color:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.7)"
                    : theme.palette.text.secondary,
                transition: "transform 0.2s ease",
              })}
            />
          </Box>

        </Box>
      </Scrollbar>
    </StyledDrawer>
  );
};

export default Sider;
