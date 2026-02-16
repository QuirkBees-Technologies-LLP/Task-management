import { Navigate } from "react-router-dom";
import { Box, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Typography
          sx={{
            fontSize: "18px",
            fontWeight: 500,
          }}
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
