import React from "react";
import { Button, Layout, Avatar, Dropdown } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined, LogoutOutlined, CameraOutlined } from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const { Header } = Layout;

const HeaderBar = ({ collapsed, setCollapsed }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleChangePhoto = () => {
    // TODO: Implement photo change functionality
    console.log('Change photo clicked');
  };

  const items = [
    // {
    //   key: "changePhoto",
    //   label: "Change Photo",
    //   icon: <CameraOutlined />,
    //   onClick: handleChangePhoto,
    // },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        background: "#fff",
        padding: "0 20px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Left: Collapse Button */}
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{
          fontSize: "16px",
          width: 40,
          height: 40,
        }}
      />

      {/* Right: Profile with Dropdown */}
      <Dropdown menu={{ items }} trigger={["click"]} placement="bottomRight">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
        >
          <Avatar
            size={40}
            style={{ backgroundColor: '#203165' }}
          >
            {user?.firstName?.charAt(0)?.toUpperCase() || 'A'}
          </Avatar>
          <span style={{ fontWeight: "500" }}>
            {user?.firstName} {user?.lastName}
          </span>
        </div>
      </Dropdown>
    </Header>
  );
};

export default HeaderBar;
