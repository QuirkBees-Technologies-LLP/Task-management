import React, { createContext, useContext, useEffect, useState } from "react";
import {
  setToken,
  getToken,
  setUser,
  getUser,
  clearAuth,
} from "../utils/authStorage";
import { authAPI } from "../services/api";

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

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);

    /**
     * Expected response structure:
     * response.data.data.token
     * response.data.data.user
     */
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
