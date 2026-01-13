import './App.css';
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import { ConfigProvider, App as AntdApp } from 'antd';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoutes from './components/PublicRoutes';
import Organisation from './pages/Organisation';
import Plans from './pages/Plans';


function App() {

  return (
    // <AuthProvider>
      <ConfigProvider
        theme={{
          "token": {
            "colorPrimary": "#203165",
            "colorInfo": "#203165",
            "colorLink": "#ff781e",
            "boxShadow": "\n\n",
            "boxShadowSecondary": "\n\n"
          },
          "components": {
            "Typography": {
              "fontFamilyCode": "\"Poppins\", sans-serif"
            }
          }
        }}
      >
        <AntdApp>
          <Routes>
          {/* Auth Pages */}
          <Route path="/login" element={<PublicRoutes><Login /></PublicRoutes>} />

          {/* Protected / App Pages */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AppLayout><Dashboard /></AppLayout>
            </ProtectedRoute>
          } />
            <Route path="/organisation" element={
            <ProtectedRoute>
              <AppLayout><Organisation /></AppLayout>
            </ProtectedRoute>
          } />
            <Route path="/plans" element={
            <ProtectedRoute>
              <AppLayout><Plans /></AppLayout>
            </ProtectedRoute>
          } />
          {/* Default route → redirect to login */}
          <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </AntdApp>
      </ConfigProvider>
    // </AuthProvider>
  );
}

export default App;