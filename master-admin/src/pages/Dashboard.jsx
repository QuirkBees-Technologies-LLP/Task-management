    import React, { useState, useEffect } from 'react';
    import { Card, Row, Col, Button, Space, Dropdown } from 'antd';
    import { CarOutlined, EnvironmentOutlined, TeamOutlined, ClockCircleOutlined, DownOutlined } from '@ant-design/icons';
    import { useAuth } from '../contexts/AuthContext';
    import { useNavigate } from 'react-router-dom';
    import { dashboardAPI } from '../services/api';

    const Dashboard = () => {
        const { user } = useAuth();
        const navigate = useNavigate();
        const [loading, setLoading] = useState(true);
        const [statsData, setStatsData] = useState({
            activeBuses: 0,
            totalRoutes: 0
        });

        useEffect(() => {
            fetchDashboardStats();
        }, []);

        const fetchDashboardStats = async () => {
            try {
                setLoading(true);
                const response = await dashboardAPI.getStats();
                if (response.data.success) {
                    setStatsData({
                        activeBuses: response.data.data.activeBuses,
                        totalRoutes: response.data.data.totalRoutes
                    });
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        const stats = [
            {
                icon: <CarOutlined style={{ fontSize: 22, color: '#ff781e' }} />,
                value: loading ? '-' : statsData.activeBuses.toString(),
                label: 'Active Buses',
            },
            {
                icon: <EnvironmentOutlined style={{ fontSize: 22, color: '#ff781e' }} />,
                value: loading ? '-' : statsData.totalRoutes.toString(),
                label: 'Total Routes',
            },
            {
                icon: <TeamOutlined style={{ fontSize: 22, color: '#ff781e' }} />,
                value: '15.2K',
                label: 'Daily Passengers',
            },
            {
                icon: <ClockCircleOutlined style={{ fontSize: 22, color: '#ff781e' }} />,
                value: '94%',
                label: 'On-time Rate',
            },
        ];
        const items = [
            { key: 'buses', label: 'Manage Buses' },
            { key: 'schedule', label: 'Schedule Management' },
        ];
        const handleMenuClick = ({ key }) => {
            if (key === 'buses') {
                navigate('/buses');
            } else if (key === 'schedule') {
                navigate('/schedule');
            }
        };
        return (
            <div>
                <div>Dashboard</div>
            </div>
        );
    };

    export default Dashboard;
