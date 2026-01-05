import { useState } from 'react';
import './App.css';
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from './components/AppLayout';
import Login from './pages/Login';
import { ConfigProvider, App as AntdApp } from 'antd';
import SignUp from './pages/SignUp';
// import Buses from './pages/Buses';
// import BusScheduleManagement from './pages/BusScheduleManagement';
import Dashboard from './pages/Dashboard';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
// import Driver from './pages/Driver';
// import RoutesPage from './pages/Routes';
import PublicRoutes from './components/publicRoutes';
import Organisation from './pages/Organisation';
import Plans from './pages/Plans';


function App() {
  const [count, setCount] = useState(0);

  return (
    <AuthProvider>
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
          {/* Signup route kept but not accessible from UI */}
          <Route path="/signup" element={<SignUp />} />

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
          
          {/* <Route path="/buses" element={
            <ProtectedRoute>
              <AppLayout><Buses /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/schedule" element={
            <ProtectedRoute>
              <AppLayout><BusScheduleManagement /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/driver" element={
            <ProtectedRoute>
              <AppLayout><Driver /></AppLayout>
            </ProtectedRoute>
          } />
          <Route path="/routes" element={
            <ProtectedRoute>
              <AppLayout><RoutesPage /></AppLayout>
            </ProtectedRoute>
          } /> */}
        


          {/* Default route → redirect to login */}
          <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </AntdApp>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;