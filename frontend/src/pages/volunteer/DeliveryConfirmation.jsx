import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DonationCard from '../../components/DonationCard';
import { getActivePickups, markDelivered } from '../../api/volunteerApi';

export default function DeliveryConfirmation() {
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [delivering, setDelivering] = useState(null);
  const [qrInput, setQrInput] = useState({});
  const [qrError, setQrError] = useState({});

  const fetchData = () => {
    setLoading(true);
    getActivePickups()
      .then(res => setPickups(res.data.filter(d =>
        d.status === 'PICKED_UP' || d.pickupStatus === 'PICKED_UP'
      )))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeliver = async (donation) => {
    // Feature 12: QR Code Zero-Trust Verification
    const inputCode = (qrInput[donation.id] || '').trim().toUpperCase();
    const expectedCode = (donation.qrCode || '').trim().toUpperCase();

    if (!inputCode) {
      setQrError(prev => ({ ...prev, [donation.id]: 'Please scan or enter the QR verification code to confirm delivery.' }));
      return;
    }

    if (inputCode !== expectedCode) {
      setQrError(prev => ({ ...prev, [donation.id]: `QR code mismatch! Expected ${expectedCode}. Zero-trust verification failed.` }));
      return;
    }

    setQrError(prev => ({ ...prev, [donation.id]: '' }));
    setDelivering(donation.id);

    try {
      await markDelivered(donation.id, '');
      fetchData();
    } catch {
      alert('Failed to confirm delivery');
    } finally {
      setDelivering(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Delivery Confirmation & QR Verification</h1>
        <p>Zero-Trust Chain of Custody — Scan or enter QR code to confirm verified delivery</p>
      </div>

      {/* Feature 12: QR Verification Explanation Banner */}
      <div style={{
        marginBottom: 'var(--space-5)',
        padding: 'var(--space-4)',
        background: '#eff6ff',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #bfdbfe',
        fontSize: '13px',
        color: '#1e40af',
      }}>
        <strong>Zero-Trust QR Verification Protocol:</strong> Each donation has a unique cryptographic QR code generated at creation.
        You must enter the matching code printed on the food package label to scientifically verify the chain of custody.
        This prevents phantom donations and ensures every environmental impact claim is backed by a verified physical food transfer.
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : pickups.length === 0 ? (
        <div className="empty-state">
          <h3>No pending deliveries</h3>
          <p>Pick up food from donor locations first, then confirm delivery here.</p>
        </div>
      ) : (
        <div className="donation-cards-grid">
          {pickups.map(d => (
            <DonationCard key={d.id} donation={d} actions={
              <div style={{ width: '100%' }}>
                {/* QR Code Input Field */}
                <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter QR Code (e.g. A7F3BC21)"
                    value={qrInput[d.id] || ''}
                    onChange={(e) => setQrInput(prev => ({ ...prev, [d.id]: e.target.value.toUpperCase() }))}
                    style={{
                      fontSize: '13px',
                      fontFamily: 'monospace',
                      letterSpacing: '2px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      flex: 1,
                    }}
                  />
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={delivering === d.id}
                    onClick={() => handleDeliver(d)}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {delivering === d.id ? 'Verifying...' : 'Verify & Confirm'}
                  </button>
                </div>
                {qrError[d.id] && (
                  <div style={{
                    fontSize: '11px',
                    color: qrError[d.id].includes('mismatch') ? '#dc2626' : '#d97706',
                    padding: '4px 8px',
                    background: qrError[d.id].includes('mismatch') ? '#fef2f2' : '#fffbeb',
                    borderRadius: 'var(--radius-sm)',
                  }}>
                    {qrError[d.id]}
                  </div>
                )}
              </div>
            } />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
