import { PriorityBadge, StatusBadge, FreshnessBar } from './Badges';

export default function DonationCard({ donation, actions }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const formatCategory = (cat) => {
    return cat?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
  };

  // Feature 5: Methane GWP 28× Risk Countdown
  const hours = donation.freshnessHoursRemaining ?? 6.0;
  const methaneRisk = hours <= 3.0 ? 'CRITICAL METHANE RISK' : hours <= 6.0 ? 'MODERATE DECOMPOSITION RISK' : 'LOW LANDFILL RISK';
  const methaneColor = hours <= 3.0 ? '#dc2626' : hours <= 6.0 ? '#d97706' : '#0d9668';
  const methanePercent = Math.min(100, Math.max(5, (hours / 12.0) * 100));
  const ch4AvoidedKg = ((donation.quantityKg || 0) * 0.06 * 28).toFixed(1); // CH4 GWP 28x

  // Feature 10: Per-Donation Environmental Impact Ledger
  const co2eAvoided = ((donation.quantityKg || 0) * 2.5).toFixed(1);
  const waterSaved = ((donation.quantityKg || 0) * 1800).toFixed(0);
  const mealsEstimated = Math.round((donation.quantityKg || 0) * 6.25);

  return (
    <div className="donation-card">
      <div className="donation-card-header">
        <div>
          <div className="donation-card-title">{donation.foodName}</div>
          <span className="badge badge-neutral" style={{ marginTop: '4px', display: 'inline-block' }}>
            {formatCategory(donation.foodCategory)}
          </span>
        </div>
        <div className="flex gap-2">
          {donation.priorityScore != null && <PriorityBadge score={donation.priorityScore} />}
          <StatusBadge status={donation.status} />
        </div>
      </div>

      <div className="donation-card-meta">
        <span className="donation-card-meta-item">
          Qty: {donation.quantityKg} kg
        </span>
        <span className="donation-card-meta-item">
          Prepared: {formatDate(donation.preparedAt)}
        </span>
        {donation.donorName && (
          <span className="donation-card-meta-item">
            By: {donation.donorName}
          </span>
        )}
      </div>

      {donation.description && (
        <div className="donation-card-desc">{donation.description}</div>
      )}

      {/* Feature 2 & 3: Freshness Bar */}
      {donation.freshnessHoursRemaining != null && (
        <FreshnessBar hoursRemaining={donation.freshnessHoursRemaining} />
      )}

      {/* Feature 5: Landfill Methane Risk Countdown Bar with Progress */}
      <div style={{
        marginTop: 'var(--space-2)',
        padding: '8px 12px',
        background: hours <= 3.0 ? '#fef2f2' : hours <= 6.0 ? '#fffbeb' : '#f0fdf4',
        borderRadius: 'var(--radius-md)',
        border: `1px solid ${methaneColor}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
          <span style={{ fontWeight: 700, color: methaneColor }}>
            ⚠️ EVS: {methaneRisk}
          </span>
          <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '10px' }}>
            CH₄ GWP: 28× · Avoided: {ch4AvoidedKg} kg CO₂e
          </span>
        </div>
        {/* Methane Risk Progress Bar */}
        <div style={{
          height: '6px',
          background: '#e2e8f0',
          borderRadius: '3px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${methanePercent}%`,
            background: `linear-gradient(90deg, ${methaneColor}, ${hours <= 3.0 ? '#991b1b' : hours <= 6.0 ? '#b45309' : '#047857'})`,
            borderRadius: '3px',
            transition: 'width 0.3s ease',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px', fontSize: '9px', color: '#94a3b8' }}>
          <span>Anaerobic decomposition</span>
          <span>{hours.toFixed(1)}h remaining</span>
        </div>
      </div>

      {/* Feature 10: Per-Donation Environmental Impact Mini-Ledger */}
      <div style={{
        marginTop: 'var(--space-2)',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '4px',
        fontSize: '10px',
      }}>
        <div style={{ background: '#f0fdf4', padding: '4px 6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, color: '#065f46' }}>{co2eAvoided} kg</div>
          <div style={{ color: '#047857' }}>CO₂e Avoided</div>
        </div>
        <div style={{ background: '#eff6ff', padding: '4px 6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, color: '#1e40af' }}>{(waterSaved / 1000).toFixed(1)} kL</div>
          <div style={{ color: '#2563eb' }}>Water Saved</div>
        </div>
        <div style={{ background: '#fefce8', padding: '4px 6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, color: '#92400e' }}>~{mealsEstimated}</div>
          <div style={{ color: '#d97706' }}>Meals</div>
        </div>
      </div>

      {/* Feature 7: UN SDG Alignment Tags */}
      <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
        <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '10px', background: '#dcfce7', color: '#166534', fontWeight: 600 }}>SDG 2: Zero Hunger</span>
        <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '10px', background: '#dbeafe', color: '#1e40af', fontWeight: 600 }}>SDG 12: Responsible</span>
        <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '10px', background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>SDG 13: Climate</span>
      </div>

      <div className="donation-card-footer">
        <div className="text-sm text-muted">
          {donation.pickupAddress}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>

      {/* Feature 12: QR Code Zero-Trust Verification Display */}
      {donation.qrCode && (
        <div style={{
          marginTop: '8px',
          padding: '6px 10px',
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>🔐</span>
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a' }}>QR Verification Code</div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 800, color: 'var(--color-primary-dark)', letterSpacing: '1.5px' }}>
                {donation.qrCode}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', color: '#64748b', fontSize: '9px' }}>
            <div>Zero-Trust</div>
            <div>Chain of Custody</div>
          </div>
        </div>
      )}
    </div>
  );
}
