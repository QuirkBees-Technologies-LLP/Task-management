import "./App.css";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoutes from "./components/PublicRoutes";
import Organisation from "./pages/Organisation";
import Plans from "./pages/Plans";
import Dashboard from "./pages/Dashboard";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#203165",
    },
    secondary: {
      main: "#ff781e",
    },
  },
  typography: {
    fontFamily: '"Poppins", sans-serif',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        {/* Auth Pages */}
        <Route
          path="/login"
          element={
            <PublicRoutes>
              <Login />
            </PublicRoutes>
          }
        />

        {/* Protected / App Pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/organisation"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Organisation />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/plans"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Plans />
              </AppLayout>
            </ProtectedRoute>
          }
        />

        {/* Default route → redirect to login */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;