import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

/* ── Layout ── */
import Layout from './components/Layout';

/* ── Contexts ── */
import { AuthProvider, useAuth } from './context/AuthContext';
import { PrivacyProvider } from './context/PrivacyContext';
import { AlertProvider } from './context/AlertContext';
import { SocketProvider } from './context/SocketContext';
import { MobileMenuProvider } from './context/MobileMenuContext';

/* ── Public pages (eager) ── */
import Landing    from './pages/Landing';
import Intake     from './pages/Intake';
import { MarketDiscovery, LawyerPublicProfile } from './pages/Marketplace';

/* ── Auth pages ── */
import Login    from './pages/Login';
import Register from './pages/Register';

/* ── Section 1: Document Studio ── */
const PortalHome       = lazy(() => import('./pages/PortalHome'));
const UploadDocument   = lazy(() => import('./pages/UploadDocument'));
const MyDocuments      = lazy(() => import('./pages/MyDocuments'));
const Analysis         = lazy(() => import('./pages/Analysis'));
const CompareDocuments = lazy(() => import('./pages/CompareDocuments'));
const ContractLifecycle = lazy(() => import('./pages/ContractLifecycle'));
const AskAI            = lazy(() => import('./pages/AskAI'));
const Alerts           = lazy(() => import('./pages/Alerts'));
const Profile          = lazy(() => import('./pages/Profile'));
const ClientLinks      = lazy(() => import('./pages/ClientLinks'));
const ObligationWeb    = lazy(() => import('./pages/ObligationWeb'));
const HelpCenter       = lazy(() => import('./pages/HelpCenter'));
const About            = lazy(() => import('./pages/About'));

/* ── Section 2: Practice Management (lawyer/admin) ── */
const PracticeHub  = lazy(() => import('./pages/PracticeHub'));
const Matters      = lazy(() => import('./pages/Matters'));
const Contacts     = lazy(() => import('./pages/Contacts'));
const Tasks        = lazy(() => import('./pages/Tasks'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));

/* ── Section 3: Legal Marketplace ── */
const FindLawyer       = lazy(() => import('./pages/FindLawyer'));
const LawyerDashboard  = lazy(() => import('./pages/LawyerDashboard'));
const LawyerClientView = lazy(() => import('./pages/LawyerClientView'));
const LawyerDocView    = lazy(() => import('./pages/LawyerDocView'));

/* ── Loading spinner ── */
function PageLoader() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, border: '3px solid var(--purple-mist)', borderTopColor: 'var(--purple)', borderRadius: '50%', animation: 'nyaya-spin 0.75s linear infinite' }} />
    </div>
  );
}

/* ── Route guards ── */
function GuestRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : children;
}

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/landing" replace />;
}

function RootRoute() {
  const { user } = useAuth();
  return user ? <PortalHome /> : <Landing />;
}

function RoleRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/landing" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

/* ── App ── */
function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AlertProvider>
          <PrivacyProvider>
            <Router>
              <Layout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>

                    {/* ── Root ── */}
                    <Route path="/" element={<RootRoute />} />

                    {/* ── Public ── */}
                    <Route path="/landing"         element={<Landing />} />
                    <Route path="/intake"          element={<Intake />} />
                    <Route path="/marketplace"     element={<MarketDiscovery />} />
                    <Route path="/marketplace/:id" element={<LawyerPublicProfile />} />

                    {/* ── Auth ── */}
                    <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
                    <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

                    {/* ── Section 1: Document Studio ── */}
                    <Route path="/upload"          element={<PrivateRoute><UploadDocument /></PrivateRoute>} />
                    <Route path="/documents"       element={<PrivateRoute><MyDocuments /></PrivateRoute>} />
                    <Route path="/analysis/:docId" element={<PrivateRoute><Analysis /></PrivateRoute>} />
                    <Route path="/ask"             element={<PrivateRoute><AskAI /></PrivateRoute>} />
                    <Route path="/compare"         element={<PrivateRoute><CompareDocuments /></PrivateRoute>} />
                    <Route path="/lifecycle"       element={<PrivateRoute><ContractLifecycle /></PrivateRoute>} />
                    <Route path="/alerts"          element={<PrivateRoute><Alerts /></PrivateRoute>} />
                    <Route path="/profile"         element={<PrivateRoute><Profile /></PrivateRoute>} />
                    <Route path="/client-links"    element={<PrivateRoute><ClientLinks /></PrivateRoute>} />
                    <Route path="/obligation-web"  element={<PrivateRoute><ObligationWeb /></PrivateRoute>} />
                    <Route path="/help"            element={<PrivateRoute><HelpCenter /></PrivateRoute>} />
                    <Route path="/about"           element={<PrivateRoute><About /></PrivateRoute>} />

                    {/* ── Section 2: Practice Management ── */}
                    <Route path="/practice"     element={<RoleRoute roles={['lawyer','admin']}><PracticeHub /></RoleRoute>} />
                    <Route path="/matters"      element={<RoleRoute roles={['lawyer','admin']}><Matters /></RoleRoute>} />
                    <Route path="/matters/:id"  element={<RoleRoute roles={['lawyer','admin']}><Matters /></RoleRoute>} />
                    <Route path="/contacts"     element={<RoleRoute roles={['lawyer','admin']}><Contacts /></RoleRoute>} />
                    <Route path="/contacts/:id" element={<RoleRoute roles={['lawyer','admin']}><Contacts /></RoleRoute>} />
                    <Route path="/tasks"        element={<RoleRoute roles={['lawyer','admin']}><Tasks /></RoleRoute>} />
                    <Route path="/cal"          element={<RoleRoute roles={['lawyer','admin']}><CalendarPage /></RoleRoute>} />

                    {/* ── Section 3: Legal Marketplace ── */}
                    <Route path="/find-lawyer" element={<PrivateRoute><FindLawyer /></PrivateRoute>} />
                    <Route path="/lawyer"      element={<RoleRoute roles={['lawyer','admin']}><LawyerDashboard /></RoleRoute>} />
                    <Route path="/lawyer/client/:linkId"
                      element={<RoleRoute roles={['lawyer','admin']}><LawyerClientView /></RoleRoute>} />
                    <Route path="/lawyer/client/:linkId/document/:docId"
                      element={<RoleRoute roles={['lawyer','admin']}><LawyerDocView /></RoleRoute>} />

                    {/* ── Fallback ── */}
                    <Route path="*" element={<Navigate to="/" replace />} />

                  </Routes>
                </Suspense>
              </Layout>
            </Router>
          </PrivacyProvider>
        </AlertProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
