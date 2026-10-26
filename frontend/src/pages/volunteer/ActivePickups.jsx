import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DonationCard from '../../components/DonationCard';
import MapView from '../../components/MapView';
import HaccpMonitorModal from '../../components/HaccpMonitorModal';
import LiveTrackingModal from '../../components/LiveTrackingModal';
import RotatingQrHandshakeModal from '../../components/RotatingQrHandshakeModal';
import { getActivePickups, markPickedUp } from '../../api/volunteerApi';
import { getMapPins } from '../../api/analyticsApi';
import { getGoogleMapsNavigationUrl } from '../../utils/gmapsUtils';

export default function ActivePickups() {
  const [pickups, setPickups] = useState([]);
  const [ecosystemPins, setEcosystemPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [haccpModalOpen, setHaccpModalOpen] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [handshakeModalOpen, setHandshakeModalOpen] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState(1);
  const [selectedTask, setSelectedTask] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([getActivePickups(), getMapPins()])
      .then(([pickupsRes, pinsRes]) => {
        setPickups(pickupsRes.data || []);
        setEcosystemPins(pinsRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handlePickup = async (id) => {
    setActing(id);
    try {
      await markPickedUp(id);
      fetchData();
    } catch {
      alert('Failed to mark as picked up');
    } finally {
      setActing(null);
    }
  };

  // Active pickup markers highlighted in orange
  const activeMarkers = pickups.filter(d => d.pickupLat && d.pickupLng).map(d => ({
    id: `active-${d.id}`,
    lat: d.pickupLat,
    lng: d.pickupLng,
    type: 'donation',
    title: `[Active Task] ${d.foodName}`,
    subtitle: `${d.quantityKg} kg • ${d.pickupAddress || 'Trichy'}`,
    phone: d.donor?.phone,
  }));

  // Background shelter markers so the volunteer can see where to deliver
  const shelterMarkers = ecosystemPins.filter(p => p.type === 'ngo' || p.type === 'donor');

  const combinedMarkers = [...activeMarkers, ...shelterMarkers];

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>Active Pickups & Navigation</h1>
          <p>Navigate to pickup locations in Google Maps, monitor IoT cold-chain telemetry, and collect surplus batches</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              setSelectedTask(pickups[0] || { id: 201, foodName: 'Banquet Meals Rescue' });
              setTrackingModalOpen(true);
            }}
            className="btn btn-primary btn-md"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800,
              minHeight: '44px',
            }}
          >
            <span>📡</span>
            <span>Live GPS Telemetry</span>
          </button>

          <button
            onClick={() => {
              setSelectedTask(pickups[0] || { id: 201, foodName: 'Banquet Meals Rescue' });
              setHandshakeModalOpen(true);
            }}
            className="btn btn-secondary btn-md"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 800,
              minHeight: '44px',
            }}
          >
            <span>🛡️</span>
            <span>Scan Donor QR</span>
          </button>

          {pickups.length > 0 && pickups[0].pickupLat && (
            <a
              href={getGoogleMapsNavigationUrl(pickups[0].pickupLat, pickups[0].pickupLng, pickups[0].foodName)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-md"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
                minHeight: '44px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
              Google Maps
            </a>
          )}
        </div>
      </div>

      {/* Map of Active Pickups & Trichy Drop-Off Shelters */}
      <div className="card mb-6" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header" style={{ marginBottom: 'var(--space-2)' }}>
          <span className="card-title">Live Pickup Radar & Trichy Destination Shelters</span>
        </div>
        <MapView
          markers={combinedMarkers.length > 0 ? combinedMarkers : activeMarkers}
          zoom={13}
          height="400px"
          showFilters={true}
          title="Active Pickups & Recipient Shelters in Trichy"
        />
      </div>

      <div className="card-header" style={{ marginBottom: 'var(--space-4)' }}>
        <span className="card-title">Assigned Pickup Tasks ({pickups.length})</span>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : pickups.length === 0 ? (
        <div className="empty-state">
          <h3>No active pickups</h3>
          <p>No pending pickup assignments at this time. Check back soon for new dispatch notifications.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {pickups.map((d, index) => (
            <DonationCard key={`pickup-${d.id}-${index}`} donation={d} actions={
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Direct Google Maps Turn-by-Turn Redirection */}
                <a
                  href={getGoogleMapsNavigationUrl(d.pickupLat || 10.7985, d.pickupLng || 78.6890, d.foodName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#1a73e8',
                    color: '#ffffff',
                    fontWeight: 700,
                    padding: '6px 12px',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    boxShadow: '0 1px 3px rgba(26, 115, 232, 0.3)',
                  }}
                  title="Launch Google Maps App Navigation to this pickup"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                  Navigate in Google Maps
                </a>

                {d.status !== 'PICKED_UP' && d.pickupStatus !== 'PICKED_UP' ? (
                  <button className="btn btn-accent btn-sm"
                          disabled={acting === d.id}
                          onClick={() => handlePickup(d.id)}>
                    {acting === d.id ? 'Updating...' : 'Mark Picked Up'}
                  </button>
                ) : null}

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#059669', color: '#059669' }}
                  onClick={() => { setSelectedTask(d); setTrackingModalOpen(true); }}
                >
                  📡 Live GPS
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#d97706', color: '#d97706' }}
                  onClick={() => { setSelectedTask(d); setHandshakeModalOpen(true); }}
                >
                  🛡️ QR Handshake
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ borderColor: '#0284c7', color: '#0284c7' }}
                  onClick={() => { setSelectedDonationId(d.id); setHaccpModalOpen(true); }}
                >
                  HACCP Cold-Chain Log
                </button>
              </div>
            } />
          ))}
        </div>
      )}

      <HaccpMonitorModal
        donationId={selectedDonationId}
        isOpen={haccpModalOpen}
        onClose={() => setHaccpModalOpen(false)}
      />

      <LiveTrackingModal
        isOpen={trackingModalOpen}
        onClose={() => setTrackingModalOpen(false)}
        taskData={selectedTask}
      />

      <RotatingQrHandshakeModal
        isOpen={handshakeModalOpen}
        onClose={() => setHandshakeModalOpen(false)}
        mode="volunteer"
        donationData={selectedTask || { id: 201, foodName: 'Banquet Meals Surplus' }}
        onHandshakeComplete={(res) => {
          alert(`Custody of Task #${res.donationId} confirmed with cryptographic signature!`);
          setHandshakeModalOpen(false);
        }}
      />
    </DashboardLayout>
  );
}
