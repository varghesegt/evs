import { useState } from 'react';
import { PriorityBadge, StatusBadge } from './Badges';
import WhatsAppDispatchModal from './WhatsAppDispatchModal';

export default function DonationCard({ donation, actions }) {
  const [showDetails, setShowDetails] = useState(false);
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  const formatCategory = (cat) => {
    return cat?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
  };

  const hours = donation.freshnessHoursRemaining ?? 6.0;
  const freshnessColor = hours <= 3.0 ? '#dc2626' : hours <= 6.0 ? '#d97706' : '#059669';
  const freshnessLabel = hours <= 3.0 ? 'Critical' : hours <= 6.0 ? 'Expiring Soon' : 'Fresh';
  const co2eAvoided = ((donation.quantityKg || 0) * 2.5).toFixed(1);
  const waterSaved = ((donation.quantityKg || 0) * 1.8).toFixed(1);
  const mealsEstimated = Math.round((donation.quantityKg || 0) * 6.25);

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '18px 20px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        <div>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: '#0f172a',
            margin: 0,
            lineHeight: 1.3,
          }}>
            {donation.foodName}
          </h3>
          <span style={{
            display: 'inline-block',
            marginTop: '4px',
            fontSize: '11px',
            fontWeight: 600,
            color: '#475569',
            background: '#f1f5f9',
            padding: '2px 8px',
            borderRadius: '4px',
          }}>
            {formatCategory(donation.foodCategory)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {donation.priorityScore != null && <PriorityBadge score={donation.priorityScore} />}
          <StatusBadge status={donation.status} />
        </div>
      </div>

      {/* Core Key Data Row (High Clarity, Decongested) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        padding: '10px 12px',
        background: '#f8fafc',
        borderRadius: '8px',
        border: '1px solid #f1f5f9',
      }}>
        <div>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Quantity</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
            {donation.quantityKg} kg <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>(~{mealsEstimated} meals)</span>
          </span>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Freshness Window</span>
          <span style={{
            fontSize: '13px',
            fontWeight: 700,
            color: freshnessColor,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: freshnessColor,
            }} />
            {hours > 0 ? `${hours.toFixed(1)}h left (${freshnessLabel})` : 'Expired'}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Prepared At</span>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            {formatDate(donation.preparedAt)}
          </span>
        </div>

        {donation.donorName && (
          <div>
            <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Donor</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
              {donation.donorName}
            </span>
          </div>
        )}
      </div>

      {/* Description if present */}
      {donation.description && (
        <p style={{
          fontSize: '12px',
          color: '#475569',
          margin: 0,
          lineHeight: '1.45',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}>
          {donation.description}
        </p>
      )}

      {/* Pickup Location & Actions Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        paddingTop: '8px',
        borderTop: '1px solid #f1f5f9',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          fontSize: '12px',
          color: '#64748b',
          maxWidth: '460px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', maxWidth: '300px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {donation.pickupAddress || 'Pickup location provided on map'}
            </span>
          </div>

          {/* Quick Google Maps App Navigation Redirection */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${donation.pickupLat || 10.7985},${donation.pickupLng || 78.6890}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#0284c7',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              padding: '2px 8px',
              borderRadius: '4px',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
            title="Open Turn-by-Turn Directions in Google Maps App"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="3 11 22 2 13 21 11 13 3 11"/>
            </svg>
            Directions (GMaps)
          </a>

          {/* Quick WhatsApp Dispatch Route Packet */}
          <button
            type="button"
            onClick={() => setWhatsAppModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#047857',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '2px 8px',
              borderRadius: '4px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            title="Generate & Send WhatsApp Route Dispatch Packet"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.814 2.8.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm6.837 5.766c-.001 3.769-3.067 6.835-6.837 6.835-1.168 0-2.273-.3-3.238-.838l-3.593.942.959-3.504c-.604-1.026-.948-2.203-.948-3.435.001-3.769 3.068-6.836 6.838-6.836 3.769 0 6.839 3.067 6.839 6.836z"/>
            </svg>
            WhatsApp
          </button>
        </div>

        {actions && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {actions}
          </div>
        )}
      </div>

      {/* Progressive Disclosure: Environmental & QR Code Data */}
      <div>
        <button
          type="button"
          onClick={() => setShowDetails(!showDetails)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: '11px',
            fontWeight: 600,
            color: '#059669',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>{showDetails ? 'Hide Impact & QR Details' : 'View Impact & QR Verification'}</span>
          <span style={{ fontSize: '9px' }}>{showDetails ? '▲' : '▼'}</span>
        </button>

        {showDetails && (
          <div style={{
            marginTop: '8px',
            padding: '10px 12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px',
            fontSize: '11px',
            animation: 'fadeIn 0.15s ease',
          }}>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Avoided CO2e</span>
              <strong style={{ color: '#047857' }}>{co2eAvoided} kg</strong>
            </div>
            <div>
              <span style={{ color: '#64748b', display: 'block' }}>Preserved Water</span>
              <strong style={{ color: '#0369a1' }}>{waterSaved} kL</strong>
            </div>
            {donation.qrCode && (
              <div>
                <span style={{ color: '#64748b', display: 'block' }}>QR Security Code</span>
                <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{donation.qrCode}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      <WhatsAppDispatchModal
        isOpen={whatsAppModalOpen}
        onClose={() => setWhatsAppModalOpen(false)}
        donation={donation}
      />
    </div>
  );
}
