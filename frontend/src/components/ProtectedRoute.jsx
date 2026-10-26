import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_FALLBACK = {
  ROLE_ADMIN: '/admin',
  ROLE_DONOR: '/donor',
  ROLE_NGO: '/ngo',
  ROLE_VOLUNTEER: '/volunteer',
};

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user role is not authorized for this specific route, redirect strictly to their own role dashboard
  if (roles && !roles.includes(user.role)) {
    const target = ROLE_FALLBACK[user.role] || '/';
    return <Navigate to={target} replace />;
  }

  return children;
}
