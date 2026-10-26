import { useState, useEffect } from 'react';
import { playRadarChime, playSuccessChime } from '../utils/soundEffects';

export default function LiveDispatchRadarModal({ isOpen, onClose, onAcceptTask }) {
  const [secondsLeft, setSecondsLeft] = useState(45);
  const [radarScanned, setRadarScanned] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(45);
      setRadarScanned(false);
      setIsAccepted(false);
      return;
    }

    // Play subtle audio alert when modal opens
    playRadarChime();

    // Simulated 1.2s radar scanning lock
    const scanTimer = setTimeout(() => {
      setRadarScanned(true);
    }, 1200);

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearTimeout(scanTimer);
      clearInterval(interval);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAccept = () => {
    setIsAccepted(true);
    playSuccessChime();
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 50, 120]);
    }
    setTimeout(() => {
      if (onAcceptTask) {
        onAcceptTask({
          id: 101,
          foodName: 'Banquet Biryani & Veg Meals',
          quantityKg: 35,
          pickupAddress: 'SRM Hotel, Near Junction, Trichy',
        });
      }
      onClose();
    }, 1200);
  };

  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (secondsLeft / 45) * circumference;

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '520px',
          width: '92%',
          padding: '24px',
          textAlign: 'center',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-2xl)',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--color-surface)',
        }}
      >
        {/* Radar Background Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(5, 150, 105, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Circular Countdown Progress with Radar Target */}
        <div style={{ position: 'relative', width: '100px', height: '100px', margin: '0 auto 16px' }}>
          <svg width="100" height="100" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke="var(--color-border)"
              strokeWidth="6"
            />
            {/* Animated countdown ring */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={secondsLeft > 15 ? '#059669' : '#ea580c'}
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>

          {/* Central Counter Display */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: '24px', fontWeight: 900, color: secondsLeft > 15 ? 'var(--color-primary)' : '#ea580c' }}>
              {secondsLeft}s
            </span>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700 }}>
              Remaining
            </span>
          </div>
        </div>

        {/* Radar Title */}
        <div style={{ marginBottom: '16px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(5, 150, 105, 0.1)',
              color: 'var(--color-primary)',
              fontSize: '12px',
              fontWeight: 800,
              letterSpacing: '0.05em',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                animation: 'pulse 1.2s infinite',
              }}
            />
            AI DISPATCH RADAR • PRIORITY MATCH
          </span>
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px', color: 'var(--color-text-primary)' }}>
            Incoming Food Rescue Task
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', margin: 0 }}>
            Matched by VRPTW multi-constraint algorithm for your EV Bike
          </p>
        </div>

        {/* Task Details Card */}
        <div
          style={{
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '16px',
            textAlign: 'left',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                 Banquet Biryani & Veg Meals
              </div>
              <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                 SRM Hotel & Convention Centre, Trichy
              </div>
            </div>
            <span
              style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '4px 10px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              35.0 kg
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              padding: '10px 0 0',
              borderTop: '1px dashed var(--color-border)',
              marginTop: '10px',
              fontSize: '12px',
            }}
          >
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Distance:</span>
              <strong style={{ color: 'var(--color-text-primary)' }}>1.8 km (6 min)</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>Freshness:</span>
              <strong style={{ color: '#ea580c' }}> 5.5h Window</strong>
            </div>
            <div>
              <span style={{ color: 'var(--color-text-muted)', display: 'block' }}>CO₂e Saved:</span>
              <strong style={{ color: '#059669' }}>87.5 kg</strong>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {secondsLeft > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
            <button
              onClick={onClose}
              disabled={isAccepted}
              className="btn btn-secondary"
              style={{ padding: '12px', fontSize: '14px', fontWeight: 600 }}
            >
              Pass (Decline)
            </button>
            <button
              onClick={handleAccept}
              disabled={isAccepted}
              className="btn btn-primary"
              style={{
                padding: '12px',
                fontSize: '14px',
                fontWeight: 800,
                background: isAccepted ? '#10b981' : undefined,
              }}
            >
              {isAccepted ? 'OK Task Assigned! Opening GPS...' : ' Accept Rescue Task'}
            </button>
          </div>
        ) : (
          <div
            style={{
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#dc2626',
              borderRadius: 'var(--radius-lg)',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
             Timer Expired. Auto-rerouted to Priya Sundaram (EV Van).
          </div>
        )}
      </div>
    </div>
  );
}
