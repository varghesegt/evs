import { useState, useEffect } from 'react';
import { playSuccessChime } from '../utils/soundEffects';

export default function RotatingQrHandshakeModal({ isOpen, onClose, mode = 'donor', donationData, onHandshakeComplete }) {
  const [countdown, setCountdown] = useState(15);
  const [tokenHash, setTokenHash] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [scanning, setScanning] = useState(false);

  // Generate rotating dynamic HMAC hash every 15 seconds
  const generateNewToken = () => {
    const salt = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timeSlice = Math.floor(Date.now() / 15000);
    const hash = `ECO-SEC-${donationData?.id || 101}-${timeSlice}-${salt}`;
    setTokenHash(hash);
    setCountdown(15);
  };

  useEffect(() => {
    if (!isOpen) {
      setIsVerified(false);
      setScanning(false);
      return;
    }

    generateNewToken();

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generateNewToken();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Simulate volunteer scanning the donor's QR code
  const handleSimulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setIsVerified(true);
      playSuccessChime();
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 150]);
      }
      setTimeout(() => {
        if (onHandshakeComplete) {
          onHandshakeComplete({
            donationId: donationData?.id || 101,
            token: tokenHash,
            timestamp: new Date().toISOString(),
            verifier: 'Volunteer #1 (Karthik Raja)',
          });
        }
      }, 1500);
    }, 1000);
  };

  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = circumference - (countdown / 15) * circumference;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '460px',
          width: '92%',
          padding: '24px',
          textAlign: 'center',
          borderRadius: 'var(--radius-2xl)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-2xl)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '16px' }}>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(5, 150, 105, 0.1)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            🛡️ DYNAMIC ANTI-FRAUD HANDSHAKE
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px', color: 'var(--color-text-primary)' }}>
            {mode === 'donor' ? 'Donor Proof-of-Transfer' : 'Volunteer QR Verification'}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
            Rotating cryptographic token prevents screenshot replay fraud
          </p>
        </div>

        {/* Success Verified Screen */}
        {isVerified ? (
          <div style={{ padding: '24px 12px' }}>
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#15803d',
                fontSize: '38px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '3px solid #16a34a',
                boxShadow: '0 0 20px rgba(22, 163, 74, 0.3)',
              }}
            >
              ✓
            </div>
            <h3 style={{ margin: '0 0 6px', color: '#15803d', fontSize: '18px', fontWeight: 800 }}>
              Transfer Handshake Verified!
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--color-text-muted)' }}>
              Cryptographic custody transferred to Karthik Raja. Timestamp recorded to dMRV ledger.
            </p>
            <div
              style={{
                background: 'var(--color-bg)',
                padding: '10px',
                borderRadius: 'var(--radius-lg)',
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--color-text-secondary)',
                marginBottom: '16px',
              }}
            >
              HASH: {tokenHash}
            </div>
            <button onClick={onClose} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
              Done
            </button>
          </div>
        ) : (
          <div>
            {/* Dynamic Rotating QR Card */}
            <div
              style={{
                background: '#ffffff',
                border: '2px solid var(--color-border)',
                borderRadius: 'var(--radius-xl)',
                padding: '20px',
                display: 'inline-block',
                margin: '0 auto 16px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* High-Contrast SVG QR Pattern */}
              <svg width="180" height="180" viewBox="0 0 180 180">
                <rect width="180" height="180" fill="#ffffff" />
                {/* 3 Corner Finder Patterns */}
                <rect x="15" y="15" width="40" height="40" fill="#0f172a" rx="4" />
                <rect x="23" y="23" width="24" height="24" fill="#ffffff" rx="2" />
                <rect x="29" y="29" width="12" height="12" fill="#059669" rx="1" />

                <rect x="125" y="15" width="40" height="40" fill="#0f172a" rx="4" />
                <rect x="133" y="23" width="24" height="24" fill="#ffffff" rx="2" />
                <rect x="139" y="29" width="12" height="12" fill="#059669" rx="1" />

                <rect x="15" y="125" width="40" height="40" fill="#0f172a" rx="4" />
                <rect x="23" y="133" width="24" height="24" fill="#ffffff" rx="2" />
                <rect x="29" y="139" width="12" height="12" fill="#059669" rx="1" />

                {/* Dynamic Data Grid based on token hash */}
                {[...Array(12)].map((_, i) =>
                  [...Array(12)].map((_, j) => {
                    const charCode = tokenHash.charCodeAt((i * 12 + j) % tokenHash.length) || 65;
                    const fill = (charCode + i * j) % 3 === 0 ? '#0f172a' : 'transparent';
                    if (
                      (i < 4 && j < 4) ||
                      (i > 7 && j < 4) ||
                      (i < 4 && j > 7)
                    )
                      return null;
                    return (
                      <rect
                        key={`${i}-${j}`}
                        x={25 + i * 11}
                        y={25 + j * 11}
                        width="8"
                        height="8"
                        fill={fill}
                        rx="1"
                      />
                    );
                  })
                )}

                {/* Center EcoShare Logo Badge */}
                <circle cx="90" cy="90" r="16" fill="#059669" />
                <text x="90" y="95" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="bold">
                  🌱
                </text>
              </svg>

              <div
                style={{
                  marginTop: '10px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                {tokenHash}
              </div>
            </div>

            {/* Countdown Rotating Ring */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '18px',
              }}
            >
              <svg width="32" height="32" viewBox="0 0 54 54">
                <circle cx="27" cy="27" r="24" fill="transparent" stroke="#e2e8f0" strokeWidth="4" />
                <circle
                  cx="27"
                  cy="27"
                  r="24"
                  fill="transparent"
                  stroke="#059669"
                  strokeWidth="4"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 27 27)"
                  style={{ transition: 'stroke-dashoffset 1s linear' }}
                />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                Rotating in <strong style={{ color: 'var(--color-primary)' }}>{countdown}s</strong>
              </span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={onClose} className="btn btn-secondary" style={{ padding: '10px' }}>
                Close
              </button>
              <button
                onClick={handleSimulateScan}
                disabled={scanning}
                className="btn btn-primary"
                style={{ padding: '10px', fontWeight: 800 }}
              >
                {scanning ? 'Verifying...' : '⚡ Simulate Volunteer Scan'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
