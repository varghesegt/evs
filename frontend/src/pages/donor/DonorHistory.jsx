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
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
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

  const filtered = donations.filter(d => {
    const matchesStatus = filter === 'ALL' || d.status === filter;
    const matchesSearch = !searchTerm || (
      (d.foodName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (d.pickupAddress || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(d.id).includes(searchTerm)
    );
    return matchesStatus && matchesSearch;
  });

  const exportCsv = () => {
    const headers = ['Batch ID', 'Food Name', 'Category', 'Quantity (kg)', 'Estimated Meals', 'CO2e Saved (kg)', 'Pickup Address', 'Status', 'Prepared At'];
    const rows = filtered.map(d => [
      d.id,
      `"${(d.foodName || '').replace(/"/g, '""')}"`,
      d.foodCategory || 'COOKED_MEALS',
      d.quantityKg || 0,
      Math.round((d.quantityKg || 0) * 2.5),
      ((d.quantityKg || 0) * 2.5).toFixed(1),
      `"${(d.pickupAddress || '').replace(/"/g, '""')}"`,
      d.status,
      d.preparedAt || ''
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ecoshare_donor_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      {/* Responsive Filter & View Operations Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
        background: 'var(--color-surface)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        {/* Status Filter Chips Container */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-2)',
          alignItems: 'center',
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

        {/* Search, View Toggle & CSV Export Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search donation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              borderRadius: '8px',
              width: '180px',
              minHeight: '34px',
            }}
          />

          <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'grid' ? '#0d9668' : '#ffffff',
                color: viewMode === 'grid' ? '#ffffff' : '#475569',
              }}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                background: viewMode === 'table' ? '#0d9668' : '#ffffff',
                color: viewMode === 'table' ? '#ffffff' : '#475569',
              }}
            >
              Table
            </button>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={exportCsv}
            style={{ fontSize: '12px', fontWeight: 700, minHeight: '34px' }}
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Donation Results Container (Cards or Table) */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No donations found</h3>
          <p>No donation records match the selected status or search query.</p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="table-responsive-desktop" style={{ marginBottom: 'var(--space-6)' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 16px' }}>Batch ID</th>
                <th style={{ padding: '14px 16px' }}>Food Name & Category</th>
                <th style={{ padding: '14px 16px' }}>Quantity (kg)</th>
                <th style={{ padding: '14px 16px' }}>Meals Fed</th>
                <th style={{ padding: '14px 16px' }}>CO2e Saved</th>
                <th style={{ padding: '14px 16px' }}>Pickup Location</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Audit Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, index) => {
                const kg = parseFloat(d.quantityKg) || 0;
                const meals = Math.round(kg * 2.5);
                const co2e = (kg * 2.5).toFixed(1);

                return (
                  <tr key={`donor-table-row-${d.id}-${index}`} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>
                      #{d.id}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{d.foodName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{d.foodCategory || 'Cooked Meals'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0d9668' }}>
                      {kg} kg
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0284c7' }}>
                      ~{meals}
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#d97706' }}>
                      {co2e} kg
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569' }}>
                      {d.pickupAddress || 'Trichy Hub'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${
                        d.status === 'DELIVERED' ? 'badge-success' :
                        d.status === 'ACCEPTED' ? 'badge-primary' :
                        d.status === 'EXPIRED' ? 'badge-danger' : 'badge-secondary'
                      }`} style={{ fontSize: '11px', fontWeight: 800 }}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => { setSelectedDonationId(d.id); setDmrvModalOpen(true); }}
                          style={{ fontSize: '11px', padding: '4px 8px', color: '#0284c7', borderColor: '#38bdf8', fontWeight: 600 }}
                        >
                          dMRV
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-xs"
                          onClick={() => { setSelectedDonationId(d.id); setHaccpModalOpen(true); }}
                          style={{ fontSize: '11px', padding: '4px 8px', color: '#059669', borderColor: '#6ee7b7', fontWeight: 600 }}
                        >
                          HACCP
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
