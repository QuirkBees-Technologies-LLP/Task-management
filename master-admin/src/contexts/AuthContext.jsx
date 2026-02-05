import { createContext, useRef, useContext, useEffect, useState } from "react";
import {
  setToken,
  getToken,
  setUser,
  getUser,
  clearAuth,
} from "../utils/authStorage";
import { authAPI } from "../services/api";
import api from "../services/api";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);

  // Update ref whenever navigate changes
  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  // Restore auth on refresh
  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getUser();

    if (storedToken && storedUser) {
      setTokenState(storedToken);
      setUserState(storedUser);
    }

    setLoading(false);
  }, []);

  // Axios Response Interceptor for token errors
  useEffect(() => {
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const errorMessage = error?.response?.data?.error || "";
        if (errorMessage === "Invalid or expired token") {
          message.error("Session expired. Please login again.");
          logout(); // Reuse your existing logout (clears storage + navigates)
        }
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []); // Empty deps: runs once, uses navigateRef

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
    navigate("/login", { replace: true });
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
    </AuthContext.Provider>
  );
};
