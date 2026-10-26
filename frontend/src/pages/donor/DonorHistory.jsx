import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import DonationCard from '../../components/DonationCard';
import EvsCertificateModal from '../../components/EvsCertificateModal';
import DmrvCredentialModal from '../../components/DmrvCredentialModal';
import HaccpMonitorModal from '../../components/HaccpMonitorModal';
import { getMyDonations } from '../../api/donationApi';
import { useAuth } from '../../context/AuthContext';

export default function DonorHistory() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [certModalOpen, setCertModalOpen] = useState(false);
  const [dmrvModalOpen, setDmrvModalOpen] = useState(false);
  const [haccpModalOpen, setHaccpModalOpen] = useState(false);
  const [selectedDonationId, setSelectedDonationId] = useState(1);

  useEffect(() => {
    getMyDonations()
      .then(res => setDonations(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? donations : donations.filter(d => d.status === filter);

  // Environmental impact calculations
  const totalKgRescued = donations.reduce((sum, d) => sum + (d.quantityKg || 0), 0);
  const totalCo2e = Math.round(totalKgRescued * 2.5 * 10) / 10;
  const totalMeals = Math.round(totalKgRescued * 6.25);
  const totalTrees = (totalCo2e / 22.0).toFixed(1);

  const statuses = [
    { id: 'ALL', label: 'All', count: donations.length },
    { id: 'VALIDATED', label: 'Pending AI Match', count: donations.filter(d => d.status === 'VALIDATED').length },
    { id: 'ACCEPTED', label: 'NGO Accepted', count: donations.filter(d => d.status === 'ACCEPTED').length },
    { id: 'DELIVERED', label: 'Delivered', count: donations.filter(d => d.status === 'DELIVERED').length },
    { id: 'EXPIRED', label: 'Expired', count: donations.filter(d => d.status === 'EXPIRED').length },
  ];

  return (
    <DashboardLayout>
      {/* Mobile-First Header */}
      <div className="page-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        <div>
          <h1>My Donation History</h1>
          <p>Track your surplus food donations, status progression, and verified carbon offsets</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => setCertModalOpen(true)}
            style={{
              minHeight: '44px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
            }}
          >
            EVS Carbon Certificate
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => { setSelectedDonationId(donations[0]?.id || 1); setDmrvModalOpen(true); }}
            style={{
              minHeight: '44px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
            }}
          >
            W3C dMRV Credential
          </button>
        </div>
      </div>

      {/* Decongested High-Clarity Environmental Impact Cards */}
      <div className="stats-grid">
        <StatCard label="Total Batches" value={donations.length} variant="primary" />
        <StatCard label="Food Rescued" value={totalKgRescued.toFixed(1)} unit="kg" variant="secondary" />
        <StatCard label="CO2e Avoided" value={totalCo2e} unit="kg" variant="accent" />
        <StatCard label="Meals Provided" value={totalMeals} variant="primary" />
      </div>

      {/* Status Filter Chips Container (Flex Wrap - No Scroll) */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-5)',
      }}>
        {statuses.map(s => (
          <button
            key={s.id}
            type="button"
            className={`btn ${filter === s.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter(s.id)}
            style={{
              borderRadius: 'var(--radius-full)',
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
            }}
          >
            {s.label} ({s.count})
          </button>
        ))}
      </div>

      {/* Donation Cards Container */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No donations found</h3>
          <p>No donation records match the selected status filter.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {filtered.map((d, index) => (
            <DonationCard
              key={`history-don-${d.id}-${index}`}
              donation={d}
              actions={
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => { setSelectedDonationId(d.id); setDmrvModalOpen(true); }}
                    style={{ fontSize: '11px', padding: '4px 10px', color: '#0284c7', borderColor: '#38bdf8', fontWeight: 600 }}
                  >
                    dMRV Claim
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-xs"
                    onClick={() => { setSelectedDonationId(d.id); setHaccpModalOpen(true); }}
                    style={{ fontSize: '11px', padding: '4px 10px', color: '#059669', borderColor: '#6ee7b7', fontWeight: 600 }}
                  >
                    Cold-Chain IoT Log
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* EVS Carbon Offset Certificate Modal */}
      <EvsCertificateModal
        donorId={user?.id || 1}
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
      />

      {/* W3C dMRV Credential Modal */}
      <DmrvCredentialModal
        donationId={selectedDonationId}
        isOpen={dmrvModalOpen}
        onClose={() => setDmrvModalOpen(false)}
      />

      {/* HACCP Cold-Chain IoT Telemetry Modal */}
      <HaccpMonitorModal
        donationId={selectedDonationId}
        isOpen={haccpModalOpen}
        onClose={() => setHaccpModalOpen(false)}
      />
    </DashboardLayout>
  );
}
