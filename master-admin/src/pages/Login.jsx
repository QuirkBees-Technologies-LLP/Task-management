import { useState } from "react";
import { Form, Input, Button, Card, Alert, App } from "antd";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import carImage from "../assets/images/car-one.jpeg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { message } = App.useApp();

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const validatePassword = (password) => {
    const errors = [];

    if (!/[a-zA-Z]/.test(password)) {
      errors.push("At least one letter (a-z or A-Z)");
    }

    if (!/[0-9]/.test(password)) {
      errors.push("At least one number (0-9)");
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push("At least one special character (like @, #, !, $, etc.)");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  };

  const onFinish = async (values) => {
    try {
      setError("");

      // Validate email format
      if (!validateEmail(values.email)) {
        message.error("Please enter a valid email address");
        return;
      }
      // Validate password
      const passwordValidation = validatePassword(values.password);
      if (!passwordValidation.isValid) {
        message.error(passwordValidation.errors[0]);
        return;
      }

      setLoading(true);
      await login({
        email: values.email,
        password: values.password,
      });

      message.success("Login successful!");
      navigate("/dashboard"); // Redirect to dashboard page
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.status === 423) {
        // Account locked
        setError(error.response.data.error);
        message.error(error.response.data.error);
      } else if (error.response?.status === 401) {
        // Invalid credentials
        setError("Invalid email or password");
        message.error("Invalid email or password");
      } else {
        // Other errors
        const errorMessage =
          error.response?.data?.error || "Login failed. Please try again.";
        setError(errorMessage);
        message.error(errorMessage);
      }
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
          background: "#F9FAFC",
        }}
      >
        <Card className="login_card" style={{ width: "400px" }}>
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

          <Form name="login" onFinish={onFinish} layout="vertical">
            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: "Please enter your email address" },
                {
                  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "Please enter a valid email address",
                },
              ]}
            >
              <Input placeholder="Enter your email address" type="email" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Please enter your password" },
              ]}
            >
              <Input.Password
                placeholder="Enter your password"
                iconRender={(visible) =>
                  visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                }
              />
            </Form.Item>

            <Form.Item className="login_btn">
              <Button type="primary" htmlType="submit" block loading={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </Form.Item>

            <Link
              style={{
                marginBottom: "10px",
                display: "block",
                fontSize: "14px",
                color: "#000",
              }}
            >
              Forgot your password?
            </Link>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
