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

  // Calculate environmental impact summary from delivered donations
  const deliveredDonations = donations.filter(d => d.status === 'DELIVERED');
  const totalKgRescued = donations.reduce((sum, d) => sum + (d.quantityKg || 0), 0);
  const totalCo2e = Math.round(totalKgRescued * 2.5 * 10) / 10;
  const totalMeals = Math.round(totalKgRescued * 6.25);

  return (
    <DashboardLayout>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <h1>My Food Donations</h1>
          <p>Complete history of your food donations, environmental ledger, and carbon offset records</p>
        </div>
        <button
          type="button"
          className="btn btn-accent btn-md"
          onClick={() => setCertModalOpen(true)}
          style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          Download Official EVS Carbon Certificate
        </button>
      </div>

      {/* Donor Environmental Impact Summary Strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-5)',
      }}>
        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>Total Donations</div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>{donations.length}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>Food Rescued</div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: '#0284c7' }}>{totalKgRescued.toFixed(1)} <span style={{ fontSize: '12px', fontWeight: 500 }}>kg</span></div>
        </div>
        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderLeft: '4px solid #0d9668' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>CO₂e Avoided</div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: '#0d9668' }}>{totalCo2e} <span style={{ fontSize: '12px', fontWeight: 500 }}>kg</span></div>
        </div>
        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderLeft: '4px solid #d97706' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>Meals Supported</div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: '#d97706' }}>{totalMeals}</div>
        </div>
        <div className="card" style={{ padding: 'var(--space-3)', textAlign: 'center', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>Trees Equivalent</div>
          <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: '#7c3aed' }}>{(totalCo2e / 22.0).toFixed(1)} <span style={{ fontSize: '12px', fontWeight: 500 }}>trees/yr</span></div>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['ALL', 'VALIDATED', 'ACCEPTED', 'DELIVERED', 'EXPIRED'].map(s => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  onClick={() => setFilter(s)}>
            {s === 'ALL' ? `All (${donations.length})` : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No donations found</h3>
          <p>No donations match the selected filter.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {filtered.map(d => (
            <DonationCard key={d.id} donation={d} />
          ))}
        </div>
      )}

      {/* Official EVS Carbon Offset Certificate Modal */}
      <EvsCertificateModal
        donorId={user?.id || 1}
        isOpen={certModalOpen}
        onClose={() => setCertModalOpen(false)}
      />
    </DashboardLayout>
  );
}
