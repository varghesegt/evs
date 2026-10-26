import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser, getDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(form);
      loginUser(res.data);
      const path = getDashboardPath();
      // Use setTimeout to ensure state is updated
      setTimeout(() => {
        const user = res.data;
        const pathMap = {
          ROLE_DONOR: '/donor',
          ROLE_NGO: '/ngo',
          ROLE_VOLUNTEER: '/volunteer',
          ROLE_ADMIN: '/admin',
        };
        navigate(pathMap[user.role] || '/');
      }, 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email, password) => {
    setForm({ email, password });
    setError('');
    setLoading(true);

    try {
      const res = await login({ email, password });
      loginUser(res.data);
      const user = res.data;
      const pathMap = {
        ROLE_DONOR: '/donor',
        ROLE_NGO: '/ngo',
        ROLE_VOLUNTEER: '/volunteer',
        ROLE_ADMIN: '/admin',
      };
      setTimeout(() => {
        navigate(pathMap[user.role] || '/');
      }, 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <h1>EcoShare AI</h1>
          </div>
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {error && (
            <div style={{
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-danger-bg)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-5)'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="auth-footer">
            New to EcoShare? <Link to="/register">Create an account</Link>
          </div>

          {/* Interactive Demo Accounts Box */}
          <div style={{
            marginTop: 'var(--space-5)',
            padding: 'var(--space-3)',
            background: 'var(--color-surface-alt)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Demo Accounts
              </span>
              <span style={{ fontSize: '10px', color: 'var(--color-primary)', fontWeight: 700 }}>
                1-Click Quick Login
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {[
                { role: 'Admin', email: 'admin@ecoshare.com', pass: 'admin123', color: '#0f172a', bg: '#f1f5f9' },
                { role: 'Donor', email: 'donor1@ecoshare.com', pass: 'donor123', color: '#047857', bg: '#ecfdf5' },
                { role: 'NGO', email: 'ngo1@ecoshare.com', pass: 'ngo123', color: '#0369a1', bg: '#f0f9ff' },
                { role: 'Volunteer', email: 'vol1@ecoshare.com', pass: 'vol123', color: '#b45309', bg: '#fffbeb' },
              ].map((acc) => (
                <div
                  key={acc.role}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    background: '#ffffff',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: acc.color }}>
                        {acc.role}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {acc.email} <span style={{ color: 'var(--color-text-muted)' }}>• {acc.pass}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin(acc.email, acc.pass)}
                    disabled={loading}
                    className="btn btn-sm"
                    style={{
                      background: acc.bg,
                      color: acc.color,
                      border: `1px solid ${acc.color}50`,
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                      minHeight: '28px',
                    }}
                  >
                    <span>Login</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
