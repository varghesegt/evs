import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import OfflineBanner from './components/OfflineBanner';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';

import DonorDashboard from './pages/donor/DonorDashboard';
import CreateDonation from './pages/donor/CreateDonation';
import DonorHistory from './pages/donor/DonorHistory';

import NgoDashboard from './pages/ngo/NgoDashboard';
import IncomingRequests from './pages/ngo/IncomingRequests';
import AssignVolunteer from './pages/ngo/AssignVolunteer';

import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import ActivePickups from './pages/volunteer/ActivePickups';
import DeliveryConfirmation from './pages/volunteer/DeliveryConfirmation';

import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import AnalyticsDashboard from './pages/admin/AnalyticsDashboard';
import Reports from './pages/admin/Reports';
import MissionControl from './pages/admin/MissionControl';

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={user ? <Navigate to={getPath(user.role)} replace /> : <Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={user ? <Navigate to={getPath(user.role)} replace /> : <Register />} />

      {/* Donor routes */}
      <Route path="/donor" element={<ProtectedRoute roles={['ROLE_DONOR']}><DonorDashboard /></ProtectedRoute>} />
      <Route path="/donor/create" element={<ProtectedRoute roles={['ROLE_DONOR']}><CreateDonation /></ProtectedRoute>} />
      <Route path="/donor/history" element={<ProtectedRoute roles={['ROLE_DONOR']}><DonorHistory /></ProtectedRoute>} />

      {/* NGO routes */}
      <Route path="/ngo" element={<ProtectedRoute roles={['ROLE_NGO']}><NgoDashboard /></ProtectedRoute>} />
      <Route path="/ngo/incoming" element={<ProtectedRoute roles={['ROLE_NGO']}><IncomingRequests /></ProtectedRoute>} />
      <Route path="/ngo/assign" element={<ProtectedRoute roles={['ROLE_NGO']}><AssignVolunteer /></ProtectedRoute>} />

      {/* Volunteer routes */}
      <Route path="/volunteer" element={<ProtectedRoute roles={['ROLE_VOLUNTEER']}><VolunteerDashboard /></ProtectedRoute>} />
      <Route path="/volunteer/active" element={<ProtectedRoute roles={['ROLE_VOLUNTEER']}><ActivePickups /></ProtectedRoute>} />
      <Route path="/volunteer/deliver" element={<ProtectedRoute roles={['ROLE_VOLUNTEER']}><DeliveryConfirmation /></ProtectedRoute>} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['ROLE_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ROLE_ADMIN']}><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute roles={['ROLE_ADMIN', 'ROLE_NGO', 'ROLE_DONOR', 'ROLE_VOLUNTEER']}><AnalyticsDashboard /></ProtectedRoute>} />
      <Route path="/admin/reports" element={<ProtectedRoute roles={['ROLE_ADMIN']}><Reports /></ProtectedRoute>} />
      <Route path="/admin/mission-control" element={<ProtectedRoute roles={['ROLE_ADMIN', 'ROLE_NGO', 'ROLE_VOLUNTEER']}><MissionControl /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function getPath(role) {
  const map = {
    ROLE_DONOR: '/donor',
    ROLE_NGO: '/ngo',
    ROLE_VOLUNTEER: '/volunteer',
    ROLE_ADMIN: '/admin',
  };
  return map[role] || '/';
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <OfflineBanner />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
