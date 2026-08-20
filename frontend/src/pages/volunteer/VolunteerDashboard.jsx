import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import DonationCard from '../../components/DonationCard';
import { getMyPickups, getActivePickups } from '../../api/volunteerApi';

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const [allPickups, setAllPickups] = useState([]);
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyPickups(), getActivePickups()])
      .then(([allRes, activeRes]) => {
        setAllPickups(allRes.data);
        setActive(activeRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const delivered = allPickups.filter(d => d.status === 'DELIVERED').length;
  const totalKg = allPickups.reduce((sum, d) => sum + (d.quantityKg || 0), 0);

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>Volunteer Logistics</h1>
          <p>Your pickup assignments, zero-trust QR verification, and delivery history</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', width: '100%', maxWidth: '400px' }}>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => navigate('/volunteer/active')}
            style={{ flex: 1, minHeight: '44px' }}
          >
            Active Pickups ({active.length})
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => navigate('/volunteer/deliver')}
            style={{ flex: 1, minHeight: '44px' }}
          >
            QR Delivery
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Active Pickups" value={active.length} variant="secondary" />
        <StatCard label="Total Deliveries" value={delivered} variant="primary" />
        <StatCard label="Food Delivered" value={`${totalKg.toFixed(1)} kg`} variant="accent" />
        <StatCard label="Total Assignments" value={allPickups.length} variant="primary" />
      </div>

      <div className="card-header" style={{ marginBottom: 'var(--space-4)' }}>
        <span className="card-title">Active Pickup Assignments</span>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : active.length === 0 ? (
        <div className="empty-state">
          <h3>No active pickups</h3>
          <p>You will be notified when new pickup assignments are available.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {active.map(d => (
            <DonationCard key={d.id} donation={d} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
