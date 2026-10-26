import { useState, useEffect } from 'react';

export default function LiveCityTicker({ onTriggerRadar }) {
  const [pulseCount, setPulseCount] = useState(0);
  const [recentEvent, setRecentEvent] = useState('SRM Hotel added 35kg Cooked Rice (Banquet Surplus)');

  // Random real-time ticker updates every 8 seconds
  useEffect(() => {
    const events = [
      'SRM Hotel added 35kg Cooked Rice (Banquet Surplus)',
      'Karthik Raja (EV Bike) accepted Task #201 en route to Sangam',
      'Trichy Seva Sangam Shelter marked 40 meals received',
      'Anbalayam Shelter request matched with Geetha Cafe bakery surplus',
      'Priya Sundaram (EV Van) completed cold-chain delivery of 65kg',
      'Hotel Sangam updated kitchen inventory: 28kg Feast Curry ready for rescue',
    ];

    const interval = setInterval(() => {
      setPulseCount((c) => c + 1);
      setRecentEvent(events[Math.floor(Math.random() * events.length)]);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #064e3b 0%, #065f46 50%, #047857 100%)',
        color: '#ffffff',
        padding: '7px 16px',
        fontSize: '12px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.15)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      }}
    >
      {/* Left Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginRight: '16px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#34d399',
              boxShadow: '0 0 8px #34d399',
              animation: 'pulse 1.2s infinite',
            }}
          />
          TRICHY RADAR
        </span>
      </div>

      {/* Center Scrolling / Dynamic Ticker Items */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          flex: 1,
        }}
      >
        <span style={{ color: '#a7f3d0' }}>
          🌿 Rescued: <strong>1,438.5 kg</strong>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
        <span>
          🥗 Meals: <strong>3,596</strong>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
        <span style={{ color: '#bae6fd' }}>
          📉 CO₂e Saved: <strong>3,596 kg</strong>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
        <span>
          🛵 Active EV Fleet: <strong>8 Drivers</strong>
        </span>
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>•</span>
        <span style={{ color: '#fef08a' }}>
          ⚡ Live Pulse: <em>{recentEvent}</em>
        </span>
      </div>

      {/* Right Quick Radar Action Button */}
      {onTriggerRadar && (
        <button
          onClick={onTriggerRadar}
          style={{
            marginLeft: '12px',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.25)',
            border: '1px solid rgba(255,255,255,0.4)',
            color: '#ffffff',
            borderRadius: '999px',
            padding: '3px 12px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>🎯</span>
          <span>Dispatch Radar</span>
        </button>
      )}
    </div>
  );
}
