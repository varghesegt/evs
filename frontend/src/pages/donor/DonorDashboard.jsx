import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import DonationCard from '../../components/DonationCard';
import MapView from '../../components/MapView';
import EvsCertificateModal from '../../components/EvsCertificateModal';
import RotatingQrHandshakeModal from '../../components/RotatingQrHandshakeModal';
import { getMyDonations } from '../../api/donationApi';
import { getMapPins } from '../../api/analyticsApi';
import { useAuth } from '../../context/AuthContext';

export default function DonorDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [mapPins, setMapPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [handshakeModalOpen, setHandshakeModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([getMyDonations(), getMapPins()])
      .then(([donationsRes, pinsRes]) => {
        setDonations(donationsRes.data || []);
        setMapPins(pinsRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const active = donations.filter(d => !['DELIVERED', 'EXPIRED', 'CANCELLED'].includes(d.status));
  const delivered = donations.filter(d => d.status === 'DELIVERED');
  const totalKg = donations.reduce((sum, d) => sum + (d.quantityKg || 0), 0);
  const totalCo2e = Math.round(totalKg * 2.5 * 10) / 10;

  // Donor's own donations pinned
  const myDonationPins = donations
    .filter(d => d.pickupLat && d.pickupLng)
    .map(d => ({
      uniqueKey: `my-donor-${d.id}-${d.pickupLat}-${d.pickupLng}`,
      id: `my-${d.id}`,
      lat: d.pickupLat,
      lng: d.pickupLng,
      type: 'donation',
      title: `[Your Donation] ${d.foodName}`,
      subtitle: `${d.quantityKg} kg • ${d.status}`,
      phone: user?.phone,
    }));

  // Combine with live Trichy ecosystem pins (shelters, volunteers, donors)
  const combinedPins = [
    ...myDonationPins,
    ...mapPins
      .filter(p => !donations.some(d => d.id === p.id && p.type === 'donation'))
      .map(p => ({
        ...p,
        uniqueKey: `ecosystem-${p.type}-${p.id}-${p.lat}-${p.lng}`,
      })),
  ];

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>Donor Overview</h1>
          <p>Track surplus food donations, live Trichy recipient shelters, AI priority routing, and carbon offsets</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => navigate('/donor/create')}
            style={{ minHeight: '44px', fontWeight: 700 }}
          >
            Create Food Donation
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => setHandshakeModalOpen(true)}
            style={{ minHeight: '44px', fontWeight: 700 }}
          >
            🛡️ Dynamic QR Handshake
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => setCertModalOpen(true)}
            style={{ minHeight: '44px', fontWeight: 700 }}
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

      {/* Live Trichy Ecosystem Radar Card */}
      <div className="card mb-6" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header" style={{ marginBottom: 'var(--space-2)' }}>
          <span className="card-title">Live Trichy Food Rescue Radar & Recipient Shelters</span>
        </div>
        <MapView
          markers={combinedPins.length > 0 ? combinedPins : mapPins}
          zoom={13}
          height="380px"
          showFilters={true}
          title="Surrounding NGO Shelters, Food Banks & Active Batches in Trichy"
        />
      </div>

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
          {donations.slice(0, 6).map((d, index) => (
            <DonationCard key={`donor-donation-${d.id}-${index}`} donation={d} />
          ))}
        </div>
      )}

      <EvsCertificateModal
        donorId={user?.id || 1}
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
      />

      <RotatingQrHandshakeModal
        isOpen={handshakeModalOpen}
        onClose={() => setHandshakeModalOpen(false)}
        mode="donor"
        donationData={donations[0] || { id: 101, foodName: 'Banquet Meals Surplus' }}
      />
    </DashboardLayout>
  );
}
