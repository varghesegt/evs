import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import DonationCard from '../../components/DonationCard';
import MapView from '../../components/MapView';
import CvrpLogisticsModal from '../../components/CvrpLogisticsModal';
import SurgeEscalationBanner from '../../components/SurgeEscalationBanner';
import { getNgoDonations } from '../../api/ngoApi';
import { getAvailableDonations } from '../../api/donationApi';
import { getMapPins } from '../../api/analyticsApi';

export default function NgoDashboard() {
  const navigate = useNavigate();
  const [myDonations, setMyDonations] = useState([]);
  const [available, setAvailable] = useState([]);
  const [mapPins, setMapPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cvrpModalOpen, setCvrpModalOpen] = useState(false);

  useEffect(() => {
    Promise.all([getNgoDonations(), getAvailableDonations(), getMapPins()])
      .then(([myRes, avRes, pinsRes]) => {
        setMyDonations(myRes.data);
        setAvailable(avRes.data);
        setMapPins(pinsRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const completed = myDonations.filter(d => d.status === 'DELIVERED').length;
  const totalKg = myDonations.reduce((sum, d) => sum + (d.quantityKg || 0), 0);

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>NGO Operations</h1>
          <p>Manage incoming food requests, view live pins, and dispatch multi-vehicle logistics</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => navigate('/ngo/incoming')}
            style={{ minHeight: '44px' }}
          >
            Incoming ({available.length})
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={() => navigate('/ngo/assign')}
            style={{ minHeight: '44px' }}
          >
            Assign Volunteers
          </button>
          <button
            type="button"
            className="btn btn-accent btn-md"
            onClick={() => setCvrpModalOpen(true)}
            style={{ minHeight: '44px' }}
          >
            VRPTW Fleet Optimizer
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Available Food Surplus" value={available.length} variant="secondary" />
        <StatCard label="Accepted Requests" value={myDonations.length} variant="primary" />
        <StatCard label="Completed Deliveries" value={completed} variant="accent" />
        <StatCard label="Total Food Handled" value={`${totalKg.toFixed(1)} kg`} variant="primary" />
      </div>

      {/* Code-Red Perishability Surge Escalation Banner */}
      <SurgeEscalationBanner onSelectBatch={() => navigate('/ngo/assign')} />

      {/* Dual-Column Operational Dispatch Grid (Side-by-side on desktop, stacked on mobile) */}
      <div className="desktop-split-60-40" style={{ marginBottom: 'var(--space-6)' }}>
        {/* Left: Realtime Map */}
        <div className="card" style={{ height: '100%' }}>
          <div className="card-header" style={{ marginBottom: 'var(--space-2)' }}>
            <span className="card-title">Realtime Ecosystem Map & Network Pin Points</span>
          </div>
          <MapView markers={mapPins} zoom={12} height="440px" showFilters={true} />
        </div>

        {/* Right: Accepted Donations Dispatch Feed */}
        <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ marginBottom: 'var(--space-3)' }}>
            <div>
              <span className="card-title">Accepted Batches</span>
              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>({myDonations.length} Active)</span>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-xs"
              onClick={() => navigate('/ngo/incoming')}
              style={{ fontSize: '11px', fontWeight: 700 }}
            >
              + Incoming ({available.length})
            </button>
          </div>

          {loading ? (
            <div className="loading-spinner"><div className="spinner"></div></div>
          ) : myDonations.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h3 style={{ fontSize: '15px' }}>No accepted batches yet</h3>
              <p style={{ fontSize: '12px' }}>Review incoming surplus food requests to accept and dispatch volunteers.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => navigate('/ngo/incoming')}
                style={{ marginTop: '12px', alignSelf: 'center' }}
              >
                Browse Incoming Requests
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '430px', paddingRight: '2px' }}>
              {myDonations.slice(0, 6).map((d, index) => (
                <div
                  key={`ngo-donation-${d.id}-${index}`}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                      #{d.id} • {d.foodName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      {d.quantityKg} kg • {d.pickupAddress || 'Trichy Hub'}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => navigate('/ngo/assign')}
                    style={{ fontWeight: 800, fontSize: '11px', padding: '6px 12px' }}
                  >
                    Assign Volunteer &rarr;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CvrpLogisticsModal
        isOpen={cvrpModalOpen}
        onClose={() => setCvrpModalOpen(false)}
      />
    </DashboardLayout>
  );
}
