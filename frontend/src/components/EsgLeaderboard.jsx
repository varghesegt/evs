import { useState, useEffect } from 'react';
import { getCorporateLeaderboard } from '../api/analyticsApi';

export default function EsgLeaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCorporateLeaderboard()
      .then(res => setLeaderboard(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getTierBadge = (tier) => {
    switch (tier) {
      case 'GREEN_GOLD':
        return { label: 'Green Gold Partner', bg: '#fef3c7', color: '#92400e', border: '#fde68a' };
      case 'SILVER_SAVIOR':
        return { label: 'Silver Sustainability Partner', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
      default:
        return { label: 'Bronze Champion', bg: '#fff7ed', color: '#c2410c', border: '#ffedd5' };
    }
  };

  return (
    <div className="card" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            CSR Compliance & ESG Impact Ranking
          </div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-text)', margin: '2px 0 0 0' }}>
            Corporate ESG Sustainability Leaderboard
          </h2>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '11px', padding: '4px 10px' }}>
          SHA-256 Verified Ledger
        </span>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <div className="table-container" style={{ margin: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Rank</th>
                <th>Corporate Donor</th>
                <th>Food Rescued</th>
                <th>CO₂e Avoided</th>
                <th>Water Conserved</th>
                <th>ESG Badge Tier</th>
                <th>SHA-256 Cryptographic Hash</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(item => {
                const badge = getTierBadge(item.tierBadge);
                return (
                  <tr key={item.donorId} style={{ background: item.rank === 1 ? '#f0fdf4' : 'transparent' }}>
                    <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '15px', color: item.rank === 1 ? '#065f46' : '#475569' }}>
                      #{item.rank}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.organizationName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{item.totalDonationsCount} Verified Surplus Batches</div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#0284c7' }}>
                      {item.totalFoodRescuedKg} kg
                    </td>
                    <td style={{ fontWeight: 700, color: '#0d9668' }}>
                      {item.totalCo2eAvoidedKg} kg
                    </td>
                    <td style={{ fontWeight: 600, color: '#7c3aed' }}>
                      {item.totalWaterSavedKL} kL
                    </td>
                    <td>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                      }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '10px', color: '#64748b', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.verifiedSha256Hash}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
