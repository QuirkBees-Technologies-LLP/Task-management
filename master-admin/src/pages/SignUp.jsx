import React, { useState } from "react";
import { Form, Input, Button, Card, Row, Col, message, Alert } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import carImage from "../assets/images/car-one.jpeg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const SignUp = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { register } = useAuth();

    // Email validation function
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const onFinish = async (values) => {
        try {
            setLoading(true);
            setError('');

            // Validate email format
            if (!validateEmail(values.email)) {
                message.error('Please enter a valid email address');
                return;
            }

            // Check password match
            if (values.password !== values.confirmPassword) {
                message.error('Passwords do not match');
                return;
            }

            await register({
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                password: values.password
            });

            message.success('Account created successfully!');
            navigate('/buses'); // Redirect to buses page

        } catch (error) {
            console.error('Registration error:', error);
            
            const errorMessage = error.response?.data?.error || 'Registration failed. Please try again.';
            setError(errorMessage);
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            {/* Left side image */}
            <div style={{ flex: 1 }}>
                <img
                    src={carImage}
                    alt="Login Illustration"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
            </div>

            {/* Right side login form */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#f9f9f9",
                }}
            >
                <Card className="login_card" style={{ width: "500px" }}>
                    <div className="login_logo">
                        <img src="src/assets/images/logo.png" alt="" />
                    </div>
                    
                    {error && (
                        <Alert
                            message={error}
                            type="error"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Form name="signup" onFinish={onFinish} layout="vertical">
                        {/* First & Last Name side by side */}
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="firstName"
                                    label="First Name"
                                    rules={[{ required: true, message: "Please enter your first name" }]}
                                >
                                    <Input placeholder="Enter First Name" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="lastName"
                                    label="Last Name"
                                    rules={[{ required: true, message: "Please enter your last name" }]}
                                >
                                    <Input placeholder="Enter Last Name" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="email"
                            label="Email Address"
                            rules={[
                                { required: true, message: "Please enter your email address" },
                                { 
                                    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
                                    message: "Please enter a valid email address" 
                                }
                            ]}
                        >
                            <Input placeholder="Enter your email address" type="email" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label="Password"
                            rules={[
                                { required: true, message: "Please enter your password" },
                                { min: 6, message: "Password must be at least 6 characters" }
                            ]}
                        >
                            <Input.Password 
                                placeholder="Enter password"
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label="Confirm Password"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: "Please confirm your password" },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Passwords do not match!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password 
                                placeholder="Confirm your password"
                                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                            />
                        </Form.Item>

                        <Form.Item className="login_btn">
                            <Button type="primary" htmlType="submit" block loading={loading}>
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </Button>
                        </Form.Item>
                        
                        <span style={{ fontSize: "14px", color: "#434343", textAlign: "center", display: "block" }}>
                            Already have an account? 
                            <Link to="/login" style={{ fontSize: "14px", marginLeft: "5px"}}>
                                Login here
                            </Link>
                        </span>

                    </Form>
                </Card>
            </div>
        </div>
    );
};

export default SignUp;
