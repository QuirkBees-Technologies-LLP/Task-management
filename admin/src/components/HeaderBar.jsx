import { AppBar, Toolbar, IconButton, Avatar, Box, Typography, Menu, MenuItem } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const HeaderBar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setAnchorEl(null);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: "#fff",
        boxShadow: "0 1px 0 0 #f0f0f0",
        height: 64,
      }}
      elevation={0}
    >
      <Toolbar
        sx={{
          padding: "0 20px",
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Left: Collapse Button */}
        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          sx={{
            width: 40,
            height: 40,
            fontSize: "16px",
          }}
          size="large"
        >
          {collapsed ? <MenuOpenIcon /> : <MenuIcon />}
        </IconButton>

        {/* Right: Profile with Dropdown */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
          onClick={handleMenuOpen}
        >
          <Avatar
            sx={{
              width: 40,
              height: 40,
              backgroundColor: '#203165',
              fontSize: "16px",
            }}
          >
            {user?.firstName?.charAt(0)?.toUpperCase() || 'A'}
          </Avatar>
          <Typography
            sx={{
              fontWeight: 500,
              fontSize: "14px",
              userSelect: "none",
            }}
          >
            {user?.firstName} {user?.lastName}
          </Typography>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 160,
            },
          }}
        >
          <MenuItem onClick={handleLogout} sx={{ gap: 1 }}>
            <LogoutIcon fontSize="small" />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default HeaderBar;
