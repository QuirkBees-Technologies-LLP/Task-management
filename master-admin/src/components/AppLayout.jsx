import { useEffect, useState } from "react";
import { Box, useTheme } from "@mui/material";
import HeaderBar from "./HeaderBar";
import SidebarMenu from "./SidebarMenu";

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const theme = useTheme();

  // Initialize and sync collapsed state based on viewport width (< 991px)
  useEffect(() => {
    const smallScreenMaxPx = 991;

    const updateCollapsedForViewport = () => {
      const small = window.innerWidth <= smallScreenMaxPx;
      setIsSmallScreen(small);
      setCollapsed(small);
    };

    updateCollapsedForViewport();
    window.addEventListener("resize", updateCollapsedForViewport);

    return () => window.removeEventListener("resize", updateCollapsedForViewport);
  }, []);

  // Prevent body scroll when mobile sidebar overlay is open
  useEffect(() => {
    const shouldLockScroll = isSmallScreen && !collapsed;
    const previousOverflow = document.body.style.overflow;

    if (shouldLockScroll) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = previousOverflow || "";
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isSmallScreen, collapsed]);

  return (
    <Box sx={{ minHeight: "100vh", display: "flex" }}>
      {/* Sidebar */}
      <SidebarMenu
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        isSmallScreen={isSmallScreen}
      />

      {/* Backdrop overlay when sidebar is open on small screens */}
      {isSmallScreen && !collapsed && (
        <Box
          className="sidebar-backdrop"
          onClick={() => setCollapsed(true)}
        />
      )}

      {/* Main Layout */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <HeaderBar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Main Content */}
        <Box
          sx={{
            padding: 3,
            minHeight: 280,
            borderRadius: theme.shape.borderRadius,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default AppLayout;
