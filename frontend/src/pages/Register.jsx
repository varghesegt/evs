import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authApi';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', address: '',
    latitude: null, longitude: null, role: 'DONOR',
    organizationName: '', registrationNumber: '', description: '',
    storageCapacityKg: 100, hasVehicle: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await register(form);
      loginUser(res.data);
      const pathMap = {
        ROLE_DONOR: '/donor',
        ROLE_NGO: '/ngo',
        ROLE_VOLUNTEER: '/volunteer',
        ROLE_ADMIN: '/admin',
      };
      setTimeout(() => navigate(pathMap[res.data.role] || '/'), 100);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '500px' }}>
        <div className="auth-card">
          <div className="auth-logo">
            <h1>EcoShare AI</h1>
          </div>
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Join the food waste prevention network</p>

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
            {step === 1 && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-role">I am registering as</label>
                  <select id="reg-role" name="role" className="form-select" value={form.role} onChange={handleChange}>
                    <option value="DONOR">Food Donor</option>
                    <option value="NGO">NGO / Organization</option>
                    <option value="VOLUNTEER">Volunteer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-name">Full Name</label>
                  <input id="reg-name" name="name" className="form-input" value={form.name}
                         onChange={handleChange} placeholder="Your name" required />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-email">Email</label>
                    <input id="reg-email" name="email" type="email" className="form-input"
                           value={form.email} onChange={handleChange} placeholder="you@example.com" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-phone">Phone</label>
                    <input id="reg-phone" name="phone" className="form-input"
                           value={form.phone} onChange={handleChange} placeholder="Phone number" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-password">Password</label>
                  <input id="reg-password" name="password" type="password" className="form-input"
                         value={form.password} onChange={handleChange} placeholder="Min 6 characters" required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-address">Address</label>
                  <input id="reg-address" name="address" className="form-input"
                         value={form.address} onChange={handleChange} placeholder="Your address" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-lat">Latitude</label>
                    <input id="reg-lat" name="latitude" type="number" step="any" className="form-input"
                           value={form.latitude || ''} onChange={e => setForm({ ...form, latitude: parseFloat(e.target.value) || null })}
                           placeholder="e.g. 10.7905" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-lng">Longitude</label>
                    <input id="reg-lng" name="longitude" type="number" step="any" className="form-input"
                           value={form.longitude || ''} onChange={e => setForm({ ...form, longitude: parseFloat(e.target.value) || null })}
                           placeholder="e.g. 78.7047" />
                  </div>
                </div>

                {form.role === 'NGO' ? (
                  <button type="button" className="btn btn-primary btn-lg" style={{ width: '100%' }}
                          onClick={() => setStep(2)}>
                    Continue
                  </button>
                ) : (
                  <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="reg-orgname">Organization Name</label>
                  <input id="reg-orgname" name="organizationName" className="form-input"
                         value={form.organizationName} onChange={handleChange} placeholder="NGO name" required />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-regnum">Registration Number</label>
                  <input id="reg-regnum" name="registrationNumber" className="form-input"
                         value={form.registrationNumber} onChange={handleChange} placeholder="e.g. NGO-TS-2024-0001" />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="reg-desc">Description</label>
                  <textarea id="reg-desc" name="description" className="form-textarea"
                            value={form.description} onChange={handleChange}
                            placeholder="Describe your organization and its mission" />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="reg-capacity">Storage Capacity (kg)</label>
                    <input id="reg-capacity" name="storageCapacityKg" type="number" className="form-input"
                           value={form.storageCapacityKg} onChange={handleChange} />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 'var(--space-2)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                      <input type="checkbox" name="hasVehicle" checked={form.hasVehicle} onChange={handleChange} />
                      <span className="form-label" style={{ margin: 0 }}>Has Vehicle</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" className="btn btn-secondary btn-lg" style={{ flex: 1 }}
                          onClick={() => setStep(1)}>
                    Back
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2 }} disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
