import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

/* ── Layout ── */
import Layout from './components/Layout';

/* ── Public pages ── */
import Landing from './pages/Landing';
import Intake from './pages/Intake';
import { MarketDiscovery, LawyerPublicProfile } from './pages/Marketplace';

/* ── Auth pages ── */
import Login from './pages/Login';
import Register from './pages/Register';

/* ── Authenticated user pages ── */
import Dashboard from './pages/Dashboard';
import UploadDocument from './pages/UploadDocument';
import MyDocuments from './pages/MyDocuments';
import Analysis from './pages/Analysis';
import CompareDocuments from './pages/CompareDocuments';
import ContractLifecycle from './pages/ContractLifecycle';
import AskAI from './pages/AskAI';
import Alerts from './pages/Alerts';
import Profile from './pages/Profile';
import ClientLinks from './pages/ClientLinks';
import ObligationWeb from './pages/ObligationWeb';
import HelpCenter from './pages/HelpCenter';
import About from './pages/About';

/* ── Lawyer-only pages ── */
import LawyerDashboard from './pages/LawyerDashboard';
import LawyerClientView from './pages/LawyerClientView';
import LawyerDocView from './pages/LawyerDocView';

/* ── Contexts ── */
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { AlertProvider } from './context/AlertContext';
import { SocketProvider } from './context/SocketContext';
import { MobileMenuProvider } from './context/MobileMenuContext';

/* ── Route guards ─────────────────────────────────────── */

/** Redirect authenticated users away from login/register */
function GuestRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

/** Redirect unauthenticated users to landing (not login) */
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/landing" replace />;
}

/** Show landing for guests, dashboard for authenticated users */
function RootRoute() {
  const { user } = useAuth();
  return user ? <Dashboard /> : <Landing />;
}

/** Redirect to / if the user's role is not in the allowed list */
function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/landing" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

/* ── App ──────────────────────────────────────────────── */
function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AlertProvider>
          <PrivacyProvider>
            <Router>
              <Layout>
                <Routes>
                  {/* ── Root: landing for guests, dashboard for users ── */}
                  <Route path="/" element={<RootRoute />} />

                  {/* ── Public pages (always accessible) ── */}
                  <Route path="/landing"     element={<Landing />} />
                  <Route path="/intake"      element={<Intake />} />
                  <Route path="/marketplace" element={<MarketDiscovery />} />
                  <Route path="/marketplace/:id" element={<LawyerPublicProfile />} />

                  {/* ── Auth pages (guest only) ── */}
                  <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
                  <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

                  {/* ── Authenticated user pages ── */}
                  <Route path="/upload"           element={<PrivateRoute><UploadDocument /></PrivateRoute>} />
                  <Route path="/documents"        element={<PrivateRoute><MyDocuments /></PrivateRoute>} />
                  <Route path="/analysis/:docId"  element={<PrivateRoute><Analysis /></PrivateRoute>} />
                  <Route path="/ask"              element={<PrivateRoute><AskAI /></PrivateRoute>} />
                  <Route path="/compare"          element={<PrivateRoute><CompareDocuments /></PrivateRoute>} />
                  <Route path="/lifecycle"        element={<PrivateRoute><ContractLifecycle /></PrivateRoute>} />
                  <Route path="/alerts"           element={<PrivateRoute><Alerts /></PrivateRoute>} />
                  <Route path="/profile"          element={<PrivateRoute><Profile /></PrivateRoute>} />
                  <Route path="/client-links"     element={<PrivateRoute><ClientLinks /></PrivateRoute>} />
                  <Route path="/obligation-web"   element={<PrivateRoute><ObligationWeb /></PrivateRoute>} />
                  <Route path="/help"             element={<PrivateRoute><HelpCenter /></PrivateRoute>} />
                  <Route path="/about"            element={<PrivateRoute><About /></PrivateRoute>} />

                  {/* ── Lawyer-only pages ── */}
                  <Route
                    path="/lawyer"
                    element={
                      <RoleRoute roles={['lawyer', 'admin']}>
                        <LawyerDashboard />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/lawyer/client/:linkId"
                    element={
                      <RoleRoute roles={['lawyer', 'admin']}>
                        <LawyerClientView />
                      </RoleRoute>
                    }
                  />
                  <Route
                    path="/lawyer/client/:linkId/document/:docId"
                    element={
                      <RoleRoute roles={['lawyer', 'admin']}>
                        <LawyerDocView />
                      </RoleRoute>
                    }
                  />

                  {/* ── Fallback ── */}
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
