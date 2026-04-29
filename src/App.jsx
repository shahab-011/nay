import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import UploadDocument from './pages/UploadDocument';
import MyDocuments from './pages/MyDocuments';
import Analysis from './pages/Analysis';
import CompareDocuments from './pages/CompareDocuments';
import ContractLifecycle from './pages/ContractLifecycle';
import AskAI from './pages/AskAI';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import LawyerDashboard from './pages/LawyerDashboard';

import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { AlertProvider } from './context/AlertContext';
import { SocketProvider } from './context/SocketContext';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

// Redirects to / if the logged-in user's role is not in the allowed list
function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <AlertProvider>
        <PrivacyProvider>
          <Router>
            <Layout>
              <Routes>
                <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

                <Route path="/"          element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                <Route path="/upload"    element={<PrivateRoute><UploadDocument /></PrivateRoute>} />
                <Route path="/documents" element={<PrivateRoute><MyDocuments /></PrivateRoute>} />
                <Route path="/analysis/:docId" element={<PrivateRoute><Analysis /></PrivateRoute>} />
                <Route path="/ask"       element={<PrivateRoute><AskAI /></PrivateRoute>} />
                <Route path="/compare"   element={<PrivateRoute><CompareDocuments /></PrivateRoute>} />
                <Route path="/lifecycle" element={<PrivateRoute><ContractLifecycle /></PrivateRoute>} />
                <Route path="/alerts"    element={<PrivateRoute><Alerts /></PrivateRoute>} />
                <Route path="/profile"   element={<PrivateRoute><Profile /></PrivateRoute>} />

                {/* Lawyer-only routes — redirect regular users to / */}
                <Route
                  path="/lawyer"
                  element={
                    <RoleRoute roles={['lawyer', 'admin']}>
                      <LawyerDashboard />
                    </RoleRoute>
                  }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </Router>
        </PrivacyProvider>
      </AlertProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
