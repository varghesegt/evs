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

          <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            <strong>Demo Accounts:</strong><br/>
            Admin: admin@ecoshare.com / admin123<br/>
            Donor: donor1@ecoshare.com / donor123<br/>
            NGO: ngo1@ecoshare.com / ngo123<br/>
            Volunteer: vol1@ecoshare.com / vol123
          </div>
        </div>
      </div>
    </div>
  );
}
