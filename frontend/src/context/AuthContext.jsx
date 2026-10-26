import { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ecoshare_token');
    const storedUser = localStorage.getItem('ecoshare_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('ecoshare_token');
        localStorage.removeItem('ecoshare_user');
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (authData) => {
    localStorage.setItem('ecoshare_token', authData.token);
    const userData = {
      id: authData.id,
      name: authData.name,
      email: authData.email,
      role: authData.role,
    };
    localStorage.setItem('ecoshare_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('ecoshare_token');
    localStorage.removeItem('ecoshare_user');
    setUser(null);
  };

  const getRoleLabel = () => {
    if (!user) return '';
    const roleMap = {
      ROLE_DONOR: 'Donor',
      ROLE_NGO: 'NGO',
      ROLE_VOLUNTEER: 'Volunteer',
      ROLE_ADMIN: 'Admin',
    };
    return roleMap[user.role] || user.role;
  };

  const getDashboardPath = (optionalRole) => {
    const roleToUse = optionalRole || user?.role;
    if (!roleToUse) return '/login';
    const pathMap = {
      ROLE_DONOR: '/donor',
      ROLE_NGO: '/ngo',
      ROLE_VOLUNTEER: '/volunteer',
      ROLE_ADMIN: '/admin',
    };
    return pathMap[roleToUse] || '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout, getRoleLabel, getDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
