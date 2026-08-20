import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DonationCard from '../../components/DonationCard';
import EvsCertificateModal from '../../components/EvsCertificateModal';
import { getMyDonations } from '../../api/donationApi';
import { useAuth } from '../../context/AuthContext';

export default function DonorHistory() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [certModalOpen, setCertModalOpen] = useState(false);

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

        <button
          type="button"
          className="btn btn-accent btn-lg"
          onClick={() => setCertModalOpen(true)}
          style={{
            minHeight: '48px',
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
            width: '100%',
            maxWidth: '340px',
          }}
        >
          Download Official EVS Carbon Certificate
        </button>
      </div>

      {/* Mobile Environmental Impact Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-5)',
      }}>
        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>
            Total Batches
          </div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-primary-dark)', margin: '2px 0' }}>
            {donations.length}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>
            Food Rescued
          </div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: '#0284c7', margin: '2px 0' }}>
            {totalKgRescued.toFixed(1)} <span style={{ fontSize: '11px', fontWeight: 500 }}>kg</span>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderLeft: '4px solid #0d9668' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>
            CO₂e Avoided
          </div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: '#0d9668', margin: '2px 0' }}>
            {totalCo2e} <span style={{ fontSize: '11px', fontWeight: 500 }}>kg</span>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>
            Meals Provided
          </div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: '#d97706', margin: '2px 0' }}>
            {totalMeals}
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em', fontWeight: 700 }}>
            Trees Equivalent
          </div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: '#7c3aed', margin: '2px 0' }}>
            {totalTrees} <span style={{ fontSize: '11px', fontWeight: 500 }}>trees/yr</span>
          </div>
        </div>
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
          {filtered.map(d => (
            <DonationCard key={d.id} donation={d} />
          ))}
        </div>
      )}

      {/* EVS Carbon Offset Certificate Modal */}
      <EvsCertificateModal
        donorId={user?.id || 1}
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
      />
    </DashboardLayout>
  );
}
