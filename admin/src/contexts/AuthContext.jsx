import {
  createContext,
  useRef,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  setToken,
  getToken,
  setUser,
  getUser,
  clearAuth,
} from "../utils/authStorage";
import { authAPI } from "../services/api";
import api from "../services/api";
import { useNavigate } from "react-router-dom";

// MUI
import { Snackbar, Alert } from "@mui/material";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUserState] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  // Snackbar state (replacement for antd message)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "error",
  });

  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  /* -------------------- Snackbar helpers -------------------- */
  const showError = (msg) => {
    setSnackbar({
      open: true,
      message: msg,
      severity: "error",
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  /* -------------------- Sync navigate ref -------------------- */
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  /* -------------------- Restore auth on refresh -------------------- */
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getUser();

    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUserState(storedUser);
    }

    setLoading(false);
  }, []);

  /* -------------------- Axios interceptor -------------------- */
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorMessage = error?.response?.data?.error || "";

        if (errorMessage === "Invalid or expired token") {
          showError("Session expired. Please login again.");
          logout();
        }

        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  /* -------------------- Auth actions -------------------- */
  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    const { token, user } = response.data;

    setToken(token);
    setUser(user);
    setTokenState(token);
    setUserState(user);

    return user;
  };

  const logout = () => {
    clearAuth();
    setUserState(null);
    setTokenState(null);
    navigateRef.current("/login", { replace: true });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!token,
      }}
    >
      {children}

      {/* Global Snackbar (AntD message replacement) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AuthContext.Provider>
  );
};
