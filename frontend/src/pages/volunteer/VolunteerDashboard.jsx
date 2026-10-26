import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import DonationCard from '../../components/DonationCard';
import MapView from '../../components/MapView';
import CvrpLogisticsModal from '../../components/CvrpLogisticsModal';
import SurgeEscalationBanner from '../../components/SurgeEscalationBanner';
import { getMyPickups, getActivePickups } from '../../api/volunteerApi';
import { getMapPins } from '../../api/analyticsApi';
import { getGoogleMapsNavigationUrl } from '../../utils/gmapsUtils';

export default function VolunteerDashboard() {
  const navigate = useNavigate();
  const [allPickups, setAllPickups] = useState([]);
  const [active, setActive] = useState([]);
  const [mapPins, setMapPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cvrpModalOpen, setCvrpModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([getMyPickups(), getActivePickups(), getMapPins()])
      .then(([allRes, activeRes, pinsRes]) => {
        setAllPickups(allRes.data || []);
        setActive(activeRes.data || []);
        setMapPins(pinsRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const delivered = allPickups.filter(d => d.status === 'DELIVERED').length;
  const totalKg = allPickups.reduce((sum, d) => sum + (d.quantityKg || 0), 0);

  // Active pickups pinned with custom tag
  const activeMarkers = active.filter(d => d.pickupLat && d.pickupLng).map(d => ({
    uniqueKey: `active-vol-${d.id}-${d.pickupLat}-${d.pickupLng}`,
    id: `active-vol-${d.id}`,
    lat: d.pickupLat,
    lng: d.pickupLng,
    type: 'donation',
    title: `[Your Pickup] ${d.foodName}`,
    subtitle: `${d.quantityKg} kg • ${d.pickupAddress || 'Trichy'}`,
    phone: d.donor?.phone,
  }));

  const allDisplayPins = [
    ...activeMarkers,
    ...mapPins
      .filter(p => !active.some(a => a.id === p.id && p.type === 'donation'))
      .map(p => ({
        ...p,
        uniqueKey: `ecosystem-${p.type}-${p.id}-${p.lat}-${p.lng}`,
      })),
  ];

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>Volunteer Logistics & Navigation</h1>
          <p>Your pickup assignments, live Google Maps GPS routing, zero-trust QR check-in, and multi-vehicle VRPTW optimization</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => setCvrpModalOpen(true)}
            style={{ minHeight: '44px', fontWeight: 700 }}
          >
            VRPTW & CVRP Route Solver
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => navigate('/volunteer/deliver')}
            style={{ minHeight: '44px', fontWeight: 700 }}
          >
            QR Verification
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Active Pickups" value={active.length} variant="secondary" />
        <StatCard label="Total Deliveries" value={delivered} variant="primary" />
        <StatCard label="Food Delivered" value={`${totalKg.toFixed(1)} kg`} variant="accent" />
        <StatCard label="Total Assignments" value={allPickups.length} variant="primary" />
      </div>

      {/* Code-Red Automated Perishability Surge Escalation Engine Banner */}
      <SurgeEscalationBanner />

      {/* Live Trichy Volunteer Logistics & GPS Navigation Radar */}
      <div className="card mb-6" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card-header" style={{ marginBottom: 'var(--space-2)' }}>
          <span className="card-title">Live Trichy Volunteer Logistics & GPS Navigation Radar</span>
        </div>
        <MapView
          markers={allDisplayPins}
          zoom={13}
          height="400px"
          showFilters={true}
          showTelemetryHud={active.length > 0}
          title="Active Pickups, Donors & Recipient Shelters across Tiruchirappalli"
        />
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
          {active.map((d, index) => (
            <DonationCard
              key={`vol-active-${d.id}-${index}`}
              donation={d}
              actions={
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
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
                    }}
                    title="Open Turn-by-Turn Navigation in Google Maps App"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                    </svg>
                    Navigate (GMaps)
                  </a>
                  <button
                    type="button"
                    className="btn btn-accent btn-sm"
                    onClick={() => navigate('/volunteer/pickups')}
                  >
                    View Task
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* Multi-Stop CVRP Logistics Solver Modal */}
      <CvrpLogisticsModal
        isOpen={cvrpModalOpen}
        onClose={() => setCvrpModalOpen(false)}
      />
    </DashboardLayout>
  );
}
