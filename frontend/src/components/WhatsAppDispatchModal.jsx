import { useState, useMemo } from 'react';
import { createWhatsAppDispatchMessage, openWhatsAppDispatch, getGoogleMapsNavigationUrl } from '../utils/gmapsUtils';

export default function WhatsAppDispatchModal({
  isOpen,
  onClose,
  donation,
  volunteer = null,
  shelter = null,
}) {
  const [customPhone, setCustomPhone] = useState(volunteer?.phone || '9443100030');
  const [customNotes, setCustomNotes] = useState('');
  const [copied, setCopied] = useState(false);

  const dispatchText = useMemo(() => {
    return createWhatsAppDispatchMessage({
      donation,
      volunteer,
      shelter,
      customNotes,
    });
  }, [donation, volunteer, shelter, customNotes]);

  if (!isOpen || !donation) return null;

  const handleSendWhatsApp = () => {
    openWhatsAppDispatch(customPhone, dispatchText);
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(dispatchText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '16px',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        maxWidth: '640px',
        width: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #128C7E 0%, #25D366 100%)',
          color: '#ffffff',
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.814 2.8.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm6.837 5.766c-.001 3.769-3.067 6.835-6.837 6.835-1.168 0-2.273-.3-3.238-.838l-3.593.942.959-3.504c-.604-1.026-.948-2.203-.948-3.435.001-3.769 3.068-6.836 6.838-6.836 3.769 0 6.839 3.067 6.839 6.836z"/>
              </svg>
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                1-Click WhatsApp Dispatch & GMaps Packet
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                Directly transmits mission route and Google Maps app deep-links to volunteer
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              border: 'none',
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {/* Quick Input Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                Recipient Mobile (WhatsApp)
              </label>
              <input
                type="text"
                className="form-control"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                placeholder="e.g. 9443100030 or 919443100030"
                style={{ fontSize: '13px', padding: '8px 12px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
                Target Courier Profile
              </label>
              <div style={{
                padding: '8px 12px',
                background: '#f8fafc',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                color: '#1e293b',
              }}>
                {volunteer?.name || 'Unassigned / Broadcast Pool'} ({volunteer?.vehicleType || 'Two-Wheeler / Courier'})
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px' }}>
              Special Dispatch Instructions (Optional)
            </label>
            <input
              type="text"
              className="form-control"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="e.g. Use kitchen rear service gate near loading bay; bring 2 insulated thermal totes"
              style={{ fontSize: '13px', padding: '8px 12px' }}
            />
          </div>

          {/* Formatted Message Preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                Formatted Dispatch Manifest (WhatsApp Markdown)
              </label>
              <button
                type="button"
                onClick={handleCopyClipboard}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? '#059669' : '#0284c7',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Text'}
              </button>
            </div>
            <pre style={{
              background: '#0f172a',
              color: '#38bdf8',
              padding: '14px',
              borderRadius: '8px',
              fontSize: '11px',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              maxHeight: '220px',
              overflowY: 'auto',
              border: '1px solid #1e293b',
              fontFamily: 'Consolas, Monaco, monospace',
            }}>
              {dispatchText}
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 24px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCopyClipboard}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              type="button"
              className="btn btn-primary btn-md"
              onClick={handleSendWhatsApp}
              style={{
                background: '#25D366',
                borderColor: '#128C7E',
                color: '#ffffff',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 20px',
                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.4)',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.814 2.8.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm6.837 5.766c-.001 3.769-3.067 6.835-6.837 6.835-1.168 0-2.273-.3-3.238-.838l-3.593.942.959-3.504c-.604-1.026-.948-2.203-.948-3.435.001-3.769 3.068-6.836 6.838-6.836 3.769 0 6.839 3.067 6.839 6.836z"/>
              </svg>
              Open in WhatsApp & Dispatch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
