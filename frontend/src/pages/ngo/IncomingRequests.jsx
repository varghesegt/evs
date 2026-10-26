import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import StatCard from '../../components/StatCard';
import DonationCard from '../../components/DonationCard';
import SurgeEscalationBanner from '../../components/SurgeEscalationBanner';
import { getAvailableDonations } from '../../api/donationApi';
import { acceptDonation } from '../../api/ngoApi';
import { getGoogleMapsNavigationUrl } from '../../utils/gmapsUtils';

const CATEGORIES = [
  { id: 'ALL', label: 'All Categories' },
  { id: 'COOKED_RICE', label: 'Rice & Biryani' },
  { id: 'COOKED_CURRY', label: 'Curry & Gravy' },
  { id: 'COOKED_VEGETABLES', label: 'Cooked Meals' },
  { id: 'BREAD_BAKERY', label: 'Breads & Bakery' },
  { id: 'FRUITS', label: 'Fresh Fruits' },
];

export default function IncomingRequests() {
  const navigate = useNavigate();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const [acceptedNotice, setAcceptedNotice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL'); // 'ALL' | 'URGENT' | 'HIGH_SCORE'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const fetchData = () => {
    setLoading(true);
    getAvailableDonations()
      .then(res => setDonations(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAccept = async (donation) => {
    setAccepting(donation.id);
    try {
      await acceptDonation(donation.id);
      setAcceptedNotice({
        id: donation.id,
        foodName: donation.foodName,
        quantityKg: donation.quantityKg,
      });
      fetchData();
    } catch {
      alert('Failed to accept food donation. Please retry.');
    } finally {
      setAccepting(null);
    }
  };

  // Filtered donations
  const filteredDonations = useMemo(() => {
    return donations.filter(d => {
      const matchesSearch = !searchTerm || (
        (d.foodName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.pickupAddress || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(d.id).includes(searchTerm)
      );

      const matchesCategory = selectedCategory === 'ALL' || d.foodCategory === selectedCategory;

      let matchesPriority = true;
      if (priorityFilter === 'URGENT') {
        matchesPriority = (d.freshnessHoursRemaining != null && d.freshnessHoursRemaining <= 3.5);
      } else if (priorityFilter === 'HIGH_SCORE') {
        matchesPriority = (d.priorityScore != null && d.priorityScore >= 80);
      }

      return matchesSearch && matchesCategory && matchesPriority;
    });
  }, [donations, searchTerm, selectedCategory, priorityFilter]);

  // Operational metrics
  const totalKg = donations.reduce((sum, d) => sum + (parseFloat(d.quantityKg) || 0), 0);
  const urgentCount = donations.filter(d => (d.freshnessHoursRemaining != null && d.freshnessHoursRemaining <= 3.5) || (d.priorityScore >= 85)).length;
  const totalMeals = Math.round(totalKg * 2.5);

  return (
    <DashboardLayout>
      {/* Executive Command Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>Incoming Food Surplus Requests</h1>
          <p>Real-time surplus food batches ready for NGO acceptance, cold-chain reservation, and volunteer dispatch</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary btn-md"
            onClick={fetchData}
            disabled={loading}
            style={{ minHeight: '44px', fontWeight: 700 }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Feed'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => navigate('/ngo/assign')}
            style={{ minHeight: '44px', fontWeight: 700 }}
          >
            Assign Volunteers ➔
          </button>
        </div>
      </div>

      {/* Operational Metrics HUD */}
      <div className="stats-grid">
        <StatCard label="Available Batches" value={donations.length} variant="secondary" />
        <StatCard label="Rescuable Food" value={`${totalKg.toFixed(1)} kg`} variant="primary" />
        <StatCard label="Urgent Freshness Alerts" value={urgentCount} variant="danger" />
        <StatCard label="Total Meals Potential" value={`~${totalMeals}`} variant="accent" />
      </div>

      {/* Code-Red Perishability Surge Escalation Banner */}
      <SurgeEscalationBanner onSelectBatch={() => navigate('/ngo/assign')} />

      {/* Accepted Confirmation Alert */}
      {acceptedNotice && (
        <div style={{
          padding: '16px 20px',
          background: '#f0fdf4',
          border: '1.5px solid #86efac',
          borderRadius: 'var(--radius-xl)',
          color: '#166534',
          fontSize: '14px',
          fontWeight: 600,
          marginBottom: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.12)',
        }}>
          <div>
            <strong>✓ Accepted Batch #{acceptedNotice.id} ({acceptedNotice.foodName} • {acceptedNotice.quantityKg} kg)!</strong>
            <div style={{ fontSize: '12px', color: '#15803d', marginTop: '2px' }}>
              Reserved for your distribution shelter. Assign a volunteer courier to initiate pickup.
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/ngo/assign')}
            style={{ fontWeight: 800, padding: '8px 16px' }}
          >
            Assign Courier Now ➔
          </button>
        </div>
      )}

      {/* Responsive Filter & Control Toolbar */}
      <div style={{
        background: 'var(--color-surface)',
        padding: '14px 18px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-xs)',
        marginBottom: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}>
        {/* Top Filter Row: Search & View Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search incoming food name, landmark, or batch ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                fontSize: '13px',
                padding: '8px 14px',
                borderRadius: '10px',
                width: '100%',
                minHeight: '40px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Priority Filter Select */}
            <select
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                minHeight: '38px',
              }}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">🔥 Urgent (&lt; 3.5h Freshness)</option>
              <option value="HIGH_SCORE">⚡ High AI Score (&gt; 80)</option>
            </select>

            {/* View Mode Toggle */}
            <div style={{ display: 'inline-flex', borderRadius: '8px', border: '1px solid #cbd5e1', overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'grid' ? '#0d9668' : '#ffffff',
                  color: viewMode === 'grid' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'table' ? '#0d9668' : '#ffffff',
                  color: viewMode === 'table' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease',
                }}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips Carousel */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '2px',
          WebkitOverflowScrolling: 'touch',
        }}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  background: isSelected ? '#0d9668' : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#475569',
                  border: isSelected ? '1px solid #0d9668' : '1px solid #cbd5e1',
                  transition: 'all 0.15s ease',
                  minHeight: '34px',
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Results View */}
      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : filteredDonations.length === 0 ? (
        <div className="empty-state">
          <h3>No matching food requests</h3>
          <p>Try adjusting your search query, priority filter, or category pills.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* High-Density Responsive Desktop Operations Table */
        <div className="table-responsive-desktop" style={{ marginBottom: 'var(--space-6)' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 16px' }}>Batch ID</th>
                <th style={{ padding: '14px 16px' }}>Food Name & Category</th>
                <th style={{ padding: '14px 16px' }}>Quantity & Meals</th>
                <th style={{ padding: '14px 16px' }}>Pickup Location</th>
                <th style={{ padding: '14px 16px' }}>Freshness Window</th>
                <th style={{ padding: '14px 16px' }}>AI Priority</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Dispatch Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((d, index) => {
                const kg = parseFloat(d.quantityKg) || 0;
                const meals = Math.round(kg * 2.5);
                const gmapsUrl = getGoogleMapsNavigationUrl(d.pickupLat || 10.8055, d.pickupLng || 78.6850, d.foodName);

                return (
                  <tr key={`incoming-table-${d.id}-${index}`} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>
                      #{d.id}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{d.foodName}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{d.foodCategory || 'Cooked Meals'}</div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0d9668' }}>{kg} kg</div>
                      <div style={{ fontSize: '11px', color: '#0284c7' }}>~{meals} Servings</div>
                    </td>
                    <td style={{ padding: '14px 16px', maxWidth: '240px' }}>
                      <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.pickupAddress || 'Tiruchirappalli Hub'}
                      </div>
                      <a
                        href={gmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '11px', color: '#0284c7', textDecoration: 'none', fontWeight: 700 }}
                      >
                        🗺️ View on Maps ↗
                      </a>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${
                        (d.freshnessHoursRemaining || 4) <= 2.5 ? 'badge-danger' :
                        (d.freshnessHoursRemaining || 4) <= 4 ? 'badge-warning' : 'badge-success'
                      }`} style={{ fontSize: '11px', fontWeight: 800 }}>
                        {d.freshnessHoursRemaining ? `${d.freshnessHoursRemaining.toFixed(1)}h remaining` : 'Fresh'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{
                          fontWeight: 800,
                          color: (d.priorityScore || 80) >= 80 ? '#dc2626' : '#d97706',
                          fontSize: '13px',
                        }}>
                          {d.priorityScore || 85}/100
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={accepting === d.id}
                        onClick={() => handleAccept(d)}
                        style={{
                          fontWeight: 800,
                          fontSize: '12px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {accepting === d.id ? 'Reserving...' : '✓ Accept Batch'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Responsive Card Grid */
        <div className="donation-cards-grid">
          {filteredDonations.map((d, index) => (
            <DonationCard
              key={`incoming-grid-${d.id}-${index}`}
              donation={d}
              actions={
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <a
                    href={getGoogleMapsNavigationUrl(d.pickupLat || 10.8055, d.pickupLng || 78.6850, d.foodName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '11px', fontWeight: 700, padding: '5px 10px' }}
                  >
                    🗺️ Location
                  </a>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={accepting === d.id}
                    onClick={() => handleAccept(d)}
                    style={{ fontWeight: 800, minWidth: '110px' }}
                  >
                    {accepting === d.id ? 'Reserving...' : 'Accept Batch'}
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
