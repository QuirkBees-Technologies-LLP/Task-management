import { useEffect, useState } from "react";
import { Layout, theme } from "antd";
import HeaderBar from "./HeaderBar";
import SidebarMenu from "./SidebarMenu";

const { Content } = Layout;

const AppLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const {
    token: { borderRadiusLG },
  } = theme.useToken();

  // Initialize and sync collapsed state based on viewport width (< 991px)
  useEffect(() => {
    const smallScreenMaxPx = 991;
    const updateCollapsedForViewport = () => {
      const small = window.innerWidth <= smallScreenMaxPx;
      setIsSmallScreen(small);
      setCollapsed(small);
    };
    updateCollapsedForViewport();
    window.addEventListener('resize', updateCollapsedForViewport);
    return () => window.removeEventListener('resize', updateCollapsedForViewport);
  }, []);

  // Prevent body scroll when mobile sidebar overlay is open
  useEffect(() => {
    const shouldLockScroll = isSmallScreen && !collapsed;
    const previousOverflow = document.body.style.overflow;
    if (shouldLockScroll) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = previousOverflow || '';
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSmallScreen, collapsed]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <SidebarMenu collapsed={collapsed} setCollapsed={setCollapsed} isSmallScreen={isSmallScreen} />

      {/* Backdrop overlay when sidebar is open on small screens */}
      {isSmallScreen && !collapsed && (
        <div
          className="sidebar-backdrop"
          onClick={() => setCollapsed(true)}
        />
      )}

      <Layout>
        {/* Header */}
        <HeaderBar collapsed={collapsed} setCollapsed={setCollapsed} />

        {/* Main Content */}
        <Content
          style={{
            // margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            // background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
