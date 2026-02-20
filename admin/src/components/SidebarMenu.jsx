import { Box, List, ListItemButton, ListItemIcon, ListItemText } from "@mui/material";
import { Link, useLocation } from "react-router-dom";
import { Calendar, Building } from "lucide-react";

const SidebarMenu = ({ collapsed, isSmallScreen }) => {
  const location = useLocation();

  // Determine selected key based on current path
  const getSelectedKey = () => {
    if (location.pathname === "/organisation") return "1";
    if (location.pathname === "/plans") return "2";
    return "1";
  };

  const sidebarWidth = collapsed ? (isSmallScreen ? 0 : 80) : 240;

  return (
    <Box
      className={`sidebar${isSmallScreen ? " sidebar-mobile" : ""}`}
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        transition: "width 0.2s ease-in-out",
        overflowX: "hidden",
        bgcolor: "primary.main",
        color: "common.white",
        display: sidebarWidth === 0 ? "none" : "flex",
        flexDirection: "column",
      }}
    >
      <div className="logo">
        {collapsed ? (
          <img src="src/assets/images/logo_2.png" alt="logo" />
        ) : (
          <img src="src/assets/images/logo.png" alt="logo" />
        )}
      </div>

      <List component="nav" sx={{ mt: 1 }}>
        <ListItemButton
          component={Link}
          to="/organisation"
          selected={getSelectedKey() === "1"}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
            <Building size={18} />
          </ListItemIcon>
          <ListItemText primary="Organisation" />
        </ListItemButton>

        <ListItemButton
          component={Link}
          to="/plans"
          selected={getSelectedKey() === "2"}
        >
          <ListItemIcon sx={{ color: "inherit", minWidth: 32 }}>
            <Calendar size={18} />
          </ListItemIcon>
          <ListItemText primary="Plans" />
        </ListItemButton>
      </List>
    </Box>
  );
};

export default SidebarMenu;
