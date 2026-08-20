import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import DonationCard from '../../components/DonationCard';
import { getMyPickups, getActivePickups } from '../../api/volunteerApi';

export default function VolunteerDashboard() {
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
      <div className="page-header">
        <h1>Volunteer Dashboard</h1>
        <p>Your pickup assignments and delivery history</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Active Pickups" value={active.length} variant="secondary" />
        <StatCard label="Total Deliveries" value={delivered} variant="primary" />
        <StatCard label="Food Delivered" value={totalKg.toFixed(1)} unit="kg" variant="accent" />
        <StatCard label="Total Assignments" value={allPickups.length} variant="primary" />
      </div>

      <div className="card-header mb-4">
        <span className="card-title">Active Assignments</span>
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
