import React from "react";
import { Layout, Menu } from "antd";
import { SettingOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { BusFront,Calendar, CalendarCheck, House, User, Building } from "lucide-react";

const { Sider } = Layout;

const SidebarMenu = ({ collapsed, setCollapsed, isSmallScreen }) => {
  const location = useLocation();

  // Determine selected key based on current path
  const getSelectedKey = () => {
    if (location.pathname === "/dashboard") return "1";
    if (location.pathname === "/organisation") return "2";
    if (location.pathname === "/plans") return "3";
    if (location.pathname === "/schedule") return "4";
    if (location.pathname === "/driver") return "5";
    if (location.pathname === "/routes") return "6";
    if (location.pathname === "/buses") return "7";
    return "1";
  };

  return (
    <Sider
      className={`sidebar${isSmallScreen ? " sidebar-mobile" : ""}`}
      trigger={null}
      collapsible
      collapsed={collapsed}
      collapsedWidth={isSmallScreen ? 0 : 80}
    >
      <div className="logo">
        {collapsed ? (
          <img src="src/assets/images/logo_2.png" alt="logo" />
        ) : (
          <img src="src/assets/images/logo.png" alt="logo" />
        )}
      </div>

      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={[
          {
            key: "1",
            icon: <House size={18} />,
            label: <Link to="/dashboard">Dashboard</Link>,
          },
          {
            key: "2",
            icon: <Building size={18} />,
            label: <Link to="/organisation">Organisation</Link>,
          },
          {
            key: "3",
            icon: <Calendar size={18} />, // Use any icon for Plans
            label: <Link to="/plans">Plans</Link>,
          },

          {
            key: "4",
            icon: <BusFront size={18} />,
            label: <Link to="/buses">Buses</Link>,
          },
          {
            key: "5",
            icon: <CalendarCheck size={18} />,
            label: <Link to="/schedule">Schedule</Link>,
          },
          {
            key: "6",
            icon: <User size={18} />,
            label: <Link to="/driver">Driver</Link>,
          },
          {
            key: "7",
            icon: <User size={18} />,
            label: <Link to="/routes">Routes</Link>,
          },

          {
            key: "8",
            icon: <SettingOutlined />,
            label: "Settings",
          },
        ]}
      />
    </Sider>
  );
};

export default SidebarMenu;
