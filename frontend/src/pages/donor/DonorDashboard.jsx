import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import DonationCard from '../../components/DonationCard';
import MapView from '../../components/MapView';
import EvsCertificateModal from '../../components/EvsCertificateModal';
import { getMyDonations } from '../../api/donationApi';
import { useAuth } from '../../context/AuthContext';

export default function DonorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certModalOpen, setCertModalOpen] = useState(false);

  useEffect(() => {
    getMyDonations()
      .then(res => setDonations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = donations.filter(d => !['DELIVERED', 'EXPIRED', 'CANCELLED'].includes(d.status));
  const delivered = donations.filter(d => d.status === 'DELIVERED');
  const totalKg = donations.reduce((sum, d) => sum + (d.quantityKg || 0), 0);
  const totalCo2e = Math.round(totalKg * 2.5 * 10) / 10;

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
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>Donor Overview</h1>
          <p>Track surplus food donations, AI priority routing, and carbon offsets</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', width: '100%', maxWidth: '400px' }}>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => navigate('/donor/create')}
            style={{ flex: 1, minHeight: '44px' }}
          >
            Create Food Donation
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => setCertModalOpen(true)}
            style={{ flex: 1, minHeight: '44px' }}
          >
            Carbon Certificate
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Donations" value={donations.length} variant="primary" />
        <StatCard label="Active Pending" value={active.length} variant="secondary" />
        <StatCard label="Delivered Meals" value={delivered.length} variant="accent" />
        <StatCard label="CO₂e Avoided" value={`${totalCo2e} kg`} variant="primary" />
      </div>

      {markers.length > 0 && (
        <div className="card mb-6" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="card-header">
            <span className="card-title">Donation GPS Radar</span>
          </div>
          <MapView markers={markers} zoom={12} height="320px" />
        </div>
      )}

      <div className="card-header" style={{ marginBottom: 'var(--space-4)' }}>
        <span className="card-title">Recent Food Donations</span>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <h3>No donations yet</h3>
          <p>Create your first food donation using our AI Volumetric Estimator.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {donations.slice(0, 6).map(d => (
            <DonationCard key={d.id} donation={d} />
          ))}
        </div>
      )}

      <EvsCertificateModal
        donorId={user?.id || 1}
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
      />
    </DashboardLayout>
  );
}
