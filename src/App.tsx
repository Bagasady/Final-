import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/Layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InputProduct from './pages/InputProduct';
import RefillStock from './pages/RefillStock';
import PrintSheets from './pages/PrintSheets';
import BoxManagement from './pages/BoxManagement';
import ActivityLogs from './pages/ActivityLogs';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import AdminUpload from './pages/AdminUpload';
import { useAuthStore } from './store/authStore';
import NotFound from './pages/NotFound';

// Protected route wrapper component
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode;
  allowedRoles?: string[];
}> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const { isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } />
          
          <Route path="/register" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Register />
            </ProtectedRoute>
          } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="input-product" element={
              <ProtectedRoute allowedRoles={['store', 'admin']}>
                <InputProduct />
              </ProtectedRoute>
            } />
            <Route path="refill" element={
              <ProtectedRoute allowedRoles={['store', 'admin']}>
                <RefillStock />
              </ProtectedRoute>
            } />
            <Route path="print-sheets" element={
              <ProtectedRoute allowedRoles={['store', 'admin']}>
                <PrintSheets />
              </ProtectedRoute>
            } />
            <Route path="box-management" element={
              <ProtectedRoute allowedRoles={['store', 'manager', 'admin']}>
                <BoxManagement />
              </ProtectedRoute>
            } />
            <Route path="analytics" element={
              <ProtectedRoute allowedRoles={['store', 'manager', 'admin']}>
                <Analytics />
              </ProtectedRoute>
            } />
            <Route path="activity-logs" element={
              <ProtectedRoute allowedRoles={['store', 'manager', 'admin']}>
                <ActivityLogs />
              </ProtectedRoute>
            } />
            <Route path="upload-csv" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUpload />
              </ProtectedRoute>
            } />
            <Route path="settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
          </Route>
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;