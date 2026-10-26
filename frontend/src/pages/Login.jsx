import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

const ROLE_DESTINATION_MAP = {
  ROLE_ADMIN: '/admin',
  ROLE_DONOR: '/donor',
  ROLE_NGO: '/ngo',
  ROLE_VOLUNTEER: '/volunteer',
};

const DEMO_ACCOUNTS = [
  {
    roleName: 'Admin',
    roleKey: 'ROLE_ADMIN',
    email: 'admin@ecoshare.com',
    pass: 'admin123',
    path: '/admin',
    icon: '👑',
    desc: 'Mission Control, User Management & Analytics',
    themeColor: '#0f172a',
    accentBg: '#f1f5f9',
    badge: 'City Administrator',
  },
  {
    roleName: 'Donor',
    roleKey: 'ROLE_DONOR',
    email: 'donor1@ecoshare.com',
    pass: 'donor123',
    path: '/donor',
    icon: '🍽️',
    desc: 'Surplus Donation Dispatch & AI Vision Tools',
    themeColor: '#059669',
    accentBg: '#ecfdf5',
    badge: 'SRM Convention Centre',
  },
  {
    roleName: 'NGO',
    roleKey: 'ROLE_NGO',
    email: 'ngo1@ecoshare.com',
    pass: 'ngo123',
    path: '/ngo',
    icon: '🏛️',
    desc: 'Shelter Inflow, Volunteer Assignment & Fleet',
    themeColor: '#0284c7',
    accentBg: '#f0f9ff',
    badge: 'Trichy Seva Sangam',
  },
  {
    roleName: 'Volunteer',
    roleKey: 'ROLE_VOLUNTEER',
    email: 'vol1@ecoshare.com',
    pass: 'vol123',
    path: '/volunteer',
    icon: '🛵',
    desc: 'Live Pickup GPS Telemetry & QR Delivery',
    themeColor: '#d97706',
    accentBg: '#fffbeb',
    badge: 'Trichy Rapid Courier',
  },
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeLoggingRole, setActiveLoggingRole] = useState(null);
  const { user, loginUser } = useAuth();
  const navigate = useNavigate();

  // Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(form);
      loginUser(res.data);
      const destination = ROLE_DESTINATION_MAP[res.data.role] || '/';
      // Navigate strictly to the role destination
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // 1-Click Role Direct Login
  const handleRoleLogin = async (account) => {
    setError('');
    setActiveLoggingRole(account.roleKey);
    setLoading(true);
    setForm({ email: account.email, password: account.pass });

    try {
      const res = await login({ email: account.email, password: account.pass });
      loginUser(res.data);
      // Strictly redirect to the specific account's dedicated page
      navigate(account.path, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || `Failed to sign in as ${account.roleName}`);
    } finally {
      setLoading(false);
      setActiveLoggingRole(null);
    }
  };

  return (
    <div className="auth-page" style={{ padding: '24px 16px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-container" style={{ width: '100%', maxWidth: '440px' }}>
        <div className="auth-card" style={{
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 12px 35px rgba(0, 0, 0, 0.08)',
          padding: '28px 22px',
          border: '1px solid #e2e8f0',
        }}>
          {/* Brand Header */}
          <div className="auth-logo" style={{ textAlign: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '32px' }}>🌱</span>
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0 0 0', color: '#0f172a' }}>
              EcoShare AI
            </h1>
          </div>
          <h2 className="auth-title" style={{ textAlign: 'center', fontSize: '18px', fontWeight: 800, margin: '4px 0 2px 0' }}>
            Portal Sign In
          </h2>
          <p className="auth-subtitle" style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', margin: '0 0 18px 0' }}>
            Select your role below for instant 1-tap demo access or enter credentials
          </p>

          {/* Active Session Warning / Switch Alert */}
          {user && (
            <div style={{
              padding: '10px 14px',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              fontSize: '12px',
              color: '#166534',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
            }}>
              <div>
                <strong>Active Session:</strong> {user.name} ({user.role?.replace('ROLE_', '')})
              </div>
              <button
                type="button"
                onClick={() => navigate(ROLE_DESTINATION_MAP[user.role] || '/')}
                style={{
                  background: '#0d9668',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Go to Dashboard ➔
              </button>
            </div>
          )}

          {error && (
            <div style={{
              padding: '12px 14px',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '16px',
              border: '1px solid #fecaca',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ============================================================
              1-CLICK ROLE DIRECT ACCESS TILES (Admin, Donor, NGO, Volunteer)
              ============================================================ */}
          <div style={{
            background: '#f8fafc',
            borderRadius: '16px',
            padding: '14px',
            border: '1px solid #e2e8f0',
            marginBottom: '20px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Instant Role Access
              </span>
              <span style={{ fontSize: '10px', color: '#0d9668', fontWeight: 800, background: '#dcfce7', padding: '2px 8px', borderRadius: '9999px' }}>
                1-Tap Auto Login
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {DEMO_ACCOUNTS.map((acc) => {
                const isLoggingThis = activeLoggingRole === acc.roleKey;
                return (
                  <button
                    key={acc.roleKey}
                    type="button"
                    onClick={() => handleRoleLogin(acc)}
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: `1.5px solid ${acc.themeColor}30`,
                      background: acc.accentBg,
                      cursor: loading ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                      minHeight: '48px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      <span style={{ fontSize: '22px' }}>{acc.icon}</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: acc.themeColor }}>
                            {acc.roleName}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#64748b',
                            background: '#ffffff',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            border: '1px solid #e2e8f0',
                          }}>
                            {acc.badge}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {acc.desc}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: acc.themeColor,
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0,
                    }}>
                      <span>{isLoggingThis ? 'Logging in...' : `Enter ${acc.roleName}`}</span>
                      <span>➔</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', margin: '18px 0', gap: '10px' }}>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
              Or Sign In With Email
            </span>
            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
          </div>

          {/* Standard Email / Password Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label className="form-label" htmlFor="login-email" style={{ fontSize: '13px', fontWeight: 700 }}>
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="e.g. admin@ecoshare.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                style={{ minHeight: '48px', fontSize: '15px', borderRadius: '10px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '18px' }}>
              <label className="form-label" htmlFor="login-password" style={{ fontSize: '13px', fontWeight: 700 }}>
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter password..."
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{ minHeight: '48px', fontSize: '15px', borderRadius: '10px' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                minHeight: '50px',
                fontSize: '15px',
                fontWeight: 800,
                borderRadius: '12px',
                boxShadow: '0 4px 14px rgba(13, 150, 104, 0.3)',
              }}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Sign In to Account'}
            </button>
          </form>

          <div className="auth-footer" style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#64748b' }}>
            New to EcoShare? <Link to="/register" style={{ fontWeight: 700 }}>Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
