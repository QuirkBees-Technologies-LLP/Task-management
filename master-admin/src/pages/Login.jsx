import { useState } from "react";
import {
  Box,
  Card,
  TextField,
  Button,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import carImage from "../assets/images/car-one.jpeg";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [snack, setSnack] = useState({ open: false, message: "", type: "success" });
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  /* -------------------- Validators (unchanged) -------------------- */
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

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

    return { isValid: errors.length === 0, errors };
  };

  /* -------------------- Submit (unchanged logic) -------------------- */
  const onFinish = async (e) => {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    try {
      setError("");

      if (!validateEmail(email)) {
        setSnack({ open: true, message: "Please enter a valid email address", type: "error" });
        return;
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setSnack({
          open: true,
          message: passwordValidation.errors[0],
          type: "error",
        });
        return;
      }

      setLoading(true);
      await login({ email, password });

      setSnack({ open: true, message: "Login successful!", type: "success" });
      navigate("/dashboard");
    } catch (error) {
      if (error.response?.status === 423) {
        setError(error.response.data.error);
        setSnack({ open: true, message: error.response.data.error, type: "error" });
      } else if (error.response?.status === 401) {
        setError("Invalid email or password");
        setSnack({ open: true, message: "Invalid email or password", type: "error" });
      } else {
        const msg =
          error.response?.data?.error || "Login failed. Please try again.";
        setError(msg);
        setSnack({ open: true, message: msg, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Left image */}
      <Box sx={{ flex: 1 }}>
        <img
          src={carImage}
          alt="Login Illustration"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </Box>

      {/* Right form */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F9FAFC",
        }}
      >
        <Card className="login_card" sx={{ width: 400, p: 3 }}>
          <Box className="login_logo" sx={{ textAlign: "center", mb: 2 }}>
            <img src="src/assets/images/logo.png" alt="" />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={onFinish}>
            <TextField
              name="email"
              label="Email Address"
              placeholder="Enter your email address"
              type="email"
              fullWidth
              margin="normal"
              required
            />

            <TextField
              name="password"
              label="Password"
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((v) => !v)}
                      edge="end"
                    >
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>

            <Link
              style={{
                marginTop: 10,
                display: "block",
                fontSize: "14px",
                color: "#000",
              }}
            >
              Forgot your password?
            </Link>
          </Box>
        </Card>
      </Box>

      {/* Snackbar (AntD message replacement) */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert severity={snack.type} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Login;
