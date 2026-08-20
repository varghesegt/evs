import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import DonationCard from '../../components/DonationCard';
import MapView from '../../components/MapView';
import { getMyDonations } from '../../api/donationApi';

export default function DonorDashboard() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyDonations()
      .then(res => setDonations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = donations.filter(d => !['DELIVERED', 'EXPIRED', 'CANCELLED'].includes(d.status));
  const delivered = donations.filter(d => d.status === 'DELIVERED');
  const totalKg = donations.reduce((sum, d) => sum + (d.quantityKg || 0), 0);

  const markers = donations
    .filter(d => d.pickupLat && d.pickupLng)
    .map(d => ({
      lat: d.pickupLat,
      lng: d.pickupLng,
      type: 'donor',
      title: d.foodName,
      subtitle: `${d.quantityKg} kg - ${d.status}`,
    }));

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Donor Dashboard</h1>
        <p>Track your food donations and environmental impact</p>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Donations" value={donations.length} variant="primary" />
        <StatCard label="Active Donations" value={active.length} variant="secondary" />
        <StatCard label="Delivered" value={delivered.length} variant="accent" />
        <StatCard label="Food Donated" value={totalKg.toFixed(1)} unit="kg" variant="primary" />
      </div>

      {markers.length > 0 && (
        <div className="card mb-6">
          <div className="card-header">
            <span className="card-title">Your Donation Locations</span>
          </div>
          <MapView markers={markers} zoom={12} />
        </div>
      )}

      <div className="card-header" style={{ marginBottom: 'var(--space-5)' }}>
        <span className="card-title">Recent Donations</span>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <h3>No donations yet</h3>
          <p>Create your first food donation to get started.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {donations.slice(0, 6).map(d => (
            <DonationCard key={d.id} donation={d} />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
