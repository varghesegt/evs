import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import DashboardLayout from '../../components/DashboardLayout';
import LiveTrackingModal from '../../components/LiveTrackingModal';
import { playHaccpAlarm } from '../../utils/soundEffects';

function MapInvalidator() {
  const map = useMap();
  useEffect(() => {
    const t0 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 60);
    const t1 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 250);
    const t2 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 600);
    let ro = null;
    try {
      const container = map.getContainer();
      if (container && typeof ResizeObserver !== 'undefined') {
        ro = new ResizeObserver(() => { try { map.invalidateSize(); } catch {} });
        ro.observe(container);
      }
    } catch {}
    const handleResize = () => { try { map.invalidateSize(); } catch {} };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [map]);
  return null;
}

const TRICHY_CENTER = [10.8050, 78.6950];

// Live fleet units roaming Trichy
const INITIAL_FLEET = [
  {
    id: 'EV-101',
    name: 'Karthik Raja',
    phone: '+91 97890 11223',
    vehicle: 'EV Cargo Bike',
    battery: 84,
    lat: 10.7985,
    lng: 78.7010,
    speed: 28,
    status: 'EN_ROUTE',
    temp: 4.2,
    currentPayload: 'Banquet Rice & Sambar (35 kg)',
    origin: 'SRM Hotel',
    destination: 'Trichy Seva Sangam',
  },
  {
    id: 'EV-102',
    name: 'Priya Sundaram',
    phone: '+91 97890 44556',
    vehicle: 'EV Refrigerated Van',
    battery: 92,
    lat: 10.8140,
    lng: 78.7080,
    speed: 34,
    status: 'DELIVERING',
    temp: 3.8,
    currentPayload: 'Cooked Feast Curry (40 kg)',
    origin: 'Hotel Sangam',
    destination: 'Anbalayam Children Home',
  },
  {
    id: 'EV-103',
    name: 'Senthil Kumar',
    phone: '+91 97890 77889',
    vehicle: 'Cargo Auto',
    battery: 71,
    lat: 10.7910,
    lng: 78.6840,
    speed: 19,
    status: 'AVAILABLE',
    temp: 5.1,
    currentPayload: 'Ready for Standby Pickup',
    origin: 'Cantonment Hub',
    destination: 'Standby / Patrol',
  },
  {
    id: 'EV-104',
    name: 'Ananya Mehra',
    phone: '+91 97890 99001',
    vehicle: 'EV Rapid Bike',
    battery: 65,
    lat: 10.8220,
    lng: 78.6940,
    speed: 24,
    status: 'EN_ROUTE',
    temp: 4.5,
    currentPayload: 'Bakery Bread & Rolls (18 kg)',
    origin: 'Royal Mahal',
    destination: 'Trichy Seva Sangam',
  },
];

export default function MissionControl() {
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  const [selectedUnit, setSelectedUnit] = useState(INITIAL_FLEET[0]);
  const [haccpAlert, setHaccpAlert] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [radarModalOpen, setRadarModalOpen] = useState(false);
  const [tempHistory, setTempHistory] = useState([4.1, 4.3, 4.2, 4.0, 4.2, 4.4, 4.2]);

  // Animate fleet coordinates slightly to show live GPS telemetry
  useEffect(() => {
    const interval = setInterval(() => {
      setFleet((prev) =>
        prev.map((unit) => {
          const dLat = (Math.random() - 0.48) * 0.0006;
          const dLng = (Math.random() - 0.48) * 0.0006;
          return {
            ...unit,
            lat: +(unit.lat + dLat).toFixed(6),
            lng: +(unit.lng + dLng).toFixed(6),
            speed: Math.max(15, Math.min(45, Math.round(unit.speed + (Math.random() - 0.5) * 4))),
            battery: unit.battery > 5 ? +(unit.battery - 0.01).toFixed(1) : 80,
          };
        })
      );

      // Fluctuate HACCP temp
      setTempHistory((prev) => {
        const nextTemp = +(4.0 + (Math.random() - 0.5) * 0.6).toFixed(1);
        return [...prev.slice(1), nextTemp];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const triggerHaccpEmergency = () => {
    setHaccpAlert(true);
    playHaccpAlarm();
    setTempHistory([4.2, 5.5, 7.8, 9.4, 11.2, 12.8, 13.5]);
  };

  const clearHaccpEmergency = () => {
    setHaccpAlert(false);
    setTempHistory([4.1, 4.3, 4.2, 4.0, 4.2, 4.4, 4.2]);
  };

  // Fleet marker icons
  const createVehicleIcon = (unit) =>
    L.divIcon({
      className: 'fleet-marker',
      html: `
        <div style="
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: ${unit.status === 'EN_ROUTE' ? '#059669' : unit.status === 'DELIVERING' ? '#2563eb' : '#64748b'};
          border: 2px solid #ffffff;
          box-shadow: 0 0 14px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
          cursor: pointer;
        ">
          ${unit.vehicle.includes('Van') ? 'VAN' : 'EV'}
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Executive Desktop Command Header */}
        <div
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-xl)',
            padding: '24px 28px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Mission Control & Fleet Command
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#64748b' }}>
              Real-time fleet telematics, cold-chain HACCP monitoring, and autonomous logistics command
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={haccpAlert ? clearHaccpEmergency : triggerHaccpEmergency}
              className="btn"
              style={{
                fontSize: '13px',
                padding: '10px 18px',
                background: haccpAlert ? '#15803d' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              {haccpAlert ? 'Resolve HACCP Breach' : 'Test Cold-Chain Breach'}
            </button>
          </div>
        </div>

        {/* HACCP Emergency Alert Banner */}
        {haccpAlert && (
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)',
              border: '2px solid #ef4444',
              borderRadius: 'var(--radius-xl)',
              color: '#ffffff',
              boxShadow: '0 4px 20px rgba(220, 38, 38, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div>
                <strong style={{ fontSize: '16px', display: 'block' }}>
                  CRITICAL HACCP COLD-CHAIN BREACH DETECTED!
                </strong>
                <span style={{ fontSize: '13px', color: '#fca5a5' }}>
                  Unit EV-101 (Karthik Raja) temperature spiked to 13.5°C in Container #2. Spoilage risk imminent.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                alert('Auto-Reroute Activated! Destination dynamically switched to Anbalayam Children Home (450m away).');
                clearHaccpEmergency();
              }}
              style={{
                background: '#ffffff',
                color: '#991b1b',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                padding: '8px 16px',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Autonomous Emergency Reroute
            </button>
          </div>
        )}

        {/* Real-Time Stats Overview HUD (4 Cards on Desktop) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
              Active Fleet Status
            </span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--color-primary)', margin: '4px 0' }}>
              4 / 4 Online
            </div>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>100% Operational In Trichy</span>
          </div>

          <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
              Average Dispatch ETA
            </span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
              3.4 mins
            </div>
            <span style={{ fontSize: '12px', color: '#059669', fontWeight: 700 }}>VRPTW Nearest-Neighbor Route</span>
          </div>

          <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
              Fleet Avg Battery
            </span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', margin: '4px 0' }}>
              78%
            </div>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Zero Tailpipe Emissions</span>
          </div>

          <div className="card" style={{ padding: '18px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 800 }}>
              HACCP Cargo Temp
            </span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: haccpAlert ? '#ef4444' : '#0284c7', margin: '4px 0' }}>
              {haccpAlert ? '13.5°C' : '4.2°C'}
            </div>
            <span style={{ fontSize: '12px', color: haccpAlert ? '#ef4444' : '#059669', fontWeight: 700 }}>
              {haccpAlert ? 'BREACH ALERT DETECTED' : 'Optimal Cold-Chain Compliance'}
            </span>
          </div>
        </div>

        {/* Main Command Room Grid: Live Radar Map (60%) & Fleet Telematics (40%) - Responsive Stacking on Mobile */}
        <div className="desktop-split-60-40" style={{ gap: 'var(--space-5)' }}>
          {/* Live Full-City Radar Map */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              borderRadius: 'var(--radius-xl)',
              height: '560px',
              position: 'relative',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                zIndex: 1000,
                background: 'rgba(255,255,255,0.94)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#059669',
                  animation: 'pulse 1.2s infinite',
                }}
              />
              Trichy City Live GPS Logistics Mesh
            </div>

            <MapContainer
              center={TRICHY_CENTER}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <MapInvalidator />
              <TileLayer
                attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                maxZoom={19}
              />

              {/* Donor Markers */}
              <Marker position={[10.7905, 78.7047]}>
                <Popup>
                  <strong>SRM Hotel & Convention Centre</strong><br />
                  Surplus: 35 kg Banquet Rice<br />
                  Status: Ready for Pickup
                </Popup>
              </Marker>

              <Marker position={[10.8050, 78.6850]}>
                <Popup>
                  <strong>Hotel Sangam Trichy</strong><br />
                  Surplus: 28 kg Curry & Roti
                </Popup>
              </Marker>

              {/* Shelter Markers */}
              <Marker position={[10.8120, 78.6920]}>
                <Popup>
                  <strong>Trichy Seva Sangam Shelter</strong><br />
                  Capacity: 120 Persons • Awaiting Delivery
                </Popup>
              </Marker>

              <Marker position={[10.8250, 78.6980]}>
                <Popup>
                  <strong>Anbalayam Children Home</strong><br />
                  Capacity: 85 Persons
                </Popup>
              </Marker>

              {/* Fleet Markers */}
              {fleet.map((unit) => (
                <Marker
                  key={unit.id}
                  position={[unit.lat, unit.lng]}
                  icon={createVehicleIcon(unit)}
                  eventHandlers={{
                    click: () => {
                      setSelectedUnit(unit);
                      setTrackingModalOpen(true);
                    },
                  }}
                >
                  <Popup>
                    <strong>{unit.name} ({unit.id})</strong><br />
                    Vehicle: {unit.vehicle}<br />
                    Battery: {unit.battery}% • Speed: {unit.speed} km/h<br />
                    <button
                      onClick={() => {
                        setSelectedUnit(unit);
                        setTrackingModalOpen(true);
                      }}
                      style={{
                        marginTop: '6px',
                        padding: '4px 8px',
                        background: '#059669',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      View Live GPS Tracker
                    </button>
                  </Popup>
                </Marker>
              ))}

              {/* Active Delivery Route Polyline */}
              <Polyline
                positions={[
                  [10.7905, 78.7047],
                  [10.7970, 78.6995],
                  [10.8055, 78.6935],
                  [10.8120, 78.6920],
                ]}
                pathOptions={{ color: '#059669', weight: 4, opacity: 0.8 }}
              />
            </MapContainer>
          </div>

          {/* Right Fleet Telemetry & HACCP Oscilloscope Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', height: '560px' }}>
            {/* Live Fleet Roster */}
            <div className="card" style={{
              padding: '18px',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    Active Couriers ({fleet.length})
                  </h3>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Live GPS & battery telematics stream
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 800, background: '#ecfdf5', padding: '3px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                  ● ALL STREAMING
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {fleet.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUnit(u);
                      setTrackingModalOpen(true);
                    }}
                    style={{
                      padding: '12px 14px',
                      background: selectedUnit.id === u.id ? 'rgba(5, 150, 105, 0.08)' : '#f8fafc',
                      border: `1px solid ${selectedUnit.id === u.id ? 'var(--color-primary)' : '#e2e8f0'}`,
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {u.name} <span style={{ fontSize: '11px', color: '#64748b' }}>({u.id})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {u.vehicle} • <strong>{u.speed} km/h</strong>
                      </div>
                      <div style={{ fontSize: '10px', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                        {u.currentPayload}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: u.battery < 20 ? '#ef4444' : '#10b981' }}>
                        {u.battery}%
                      </div>
                      <span
                        style={{
                          display: 'inline-block',
                          fontSize: '10px',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: u.status === 'EN_ROUTE' ? '#dcfce7' : '#e0e7ff',
                          color: u.status === 'EN_ROUTE' ? '#15803d' : '#3730a3',
                          fontWeight: 800,
                          marginTop: '4px',
                        }}
                      >
                        {u.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live HACCP Rolling Telemetry Graph */}
            <div className="card" style={{
              padding: '14px 18px',
              flexShrink: 0,
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    IoT HACCP Thermal Stream
                  </h4>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    Bluetooth Food-Core Probe Sensor
                  </div>
                </div>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: haccpAlert ? '#ef4444' : '#0284c7',
                  background: haccpAlert ? '#fef2f2' : '#f0f9ff',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  border: `1px solid ${haccpAlert ? '#fecaca' : '#bae6fd'}`,
                }}>
                  {tempHistory[tempHistory.length - 1]}°C
                </span>
              </div>

              {/* Simulated Oscilloscope Bar Chart */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '6px',
                  height: '65px',
                  padding: '8px 0',
                  borderBottom: '1px dashed var(--color-border)',
                }}
              >
                {tempHistory.map((val, idx) => {
                  const barHeight = Math.min(100, Math.max(15, (val / 15) * 100));
                  const isWarning = val > 8.0;
                  return (
                    <div
                      key={idx}
                      style={{
                        flex: 1,
                        height: `${barHeight}%`,
                        background: isWarning ? '#ef4444' : '#0284c7',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 0.4s ease',
                      }}
                      title={`${val}°C`}
                    />
                  );
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: '#64748b',
                  marginTop: '6px',
                  fontWeight: 600,
                }}
              >
                <span>-10s</span>
                <span>Safe Threshold: &lt; 5°C</span>
                <span>Real-Time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Desktop Active Missions & Dispatch Table (NO CONTENT HIDDEN) */}
        <div className="card" style={{
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-sm)',
          background: 'var(--color-surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Active Telematics & Dispatch Operations
              </h2>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Detailed real-time battery SoC, temperature sensor streams, and dispatch routes
              </p>
            </div>
            <button
              onClick={() => setRadarModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700 }}
            >
              + Dispatch New Task
            </button>
          </div>

          <div className="table-container" style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <table className="table" style={{ width: '100%', minWidth: '950px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#475569', width: '90px' }}>Unit ID</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Courier Name & Contact</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Vehicle & Model</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 800, color: '#475569' }}>Active Cargo Payload</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#475569', width: '120px' }}>Battery (SoC)</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#475569', width: '120px' }}>HACCP Temp</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#475569', width: '100px' }}>Speed</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#475569', width: '120px' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 800, color: '#475569', width: '140px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {fleet.map((unit) => (
                  <tr key={unit.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    {/* Unit ID */}
                    <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0d9668', fontSize: '13px' }}>
                      {unit.id}
                    </td>

                    {/* Courier & Contact */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{unit.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        Tel: {unit.phone}
                      </div>
                    </td>

                    {/* Vehicle */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#1e293b' }}>
                        <span>{unit.vehicle}</span>
                      </div>
                    </td>

                    {/* Cargo Payload */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                        {unit.currentPayload}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                        {unit.origin} to {unit.destination}
                      </div>
                    </td>

                    {/* Battery */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, color: unit.battery < 25 ? '#ef4444' : '#10b981', fontSize: '13px' }}>
                        {unit.battery}%
                      </div>
                      <div style={{ width: '60px', height: '5px', background: '#e2e8f0', borderRadius: '3px', margin: '4px auto 0', overflow: 'hidden' }}>
                        <div style={{ width: `${unit.battery}%`, height: '100%', background: unit.battery < 25 ? '#ef4444' : '#10b981' }} />
                      </div>
                    </td>

                    {/* Temp */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        background: (unit.id === 'EV-101' && haccpAlert) ? '#fef2f2' : '#f0f9ff',
                        color: (unit.id === 'EV-101' && haccpAlert) ? '#ef4444' : '#0369a1',
                        border: `1px solid ${(unit.id === 'EV-101' && haccpAlert) ? '#fecaca' : '#bae6fd'}`,
                      }}>
                        {(unit.id === 'EV-101' && haccpAlert) ? '13.5°C (Alert)' : `${unit.temp}°C`}
                      </span>
                    </td>

                    {/* Speed */}
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: '#1e293b' }}>
                      {unit.speed} km/h
                    </td>

                    {/* Status */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '999px',
                        fontSize: '11px',
                        fontWeight: 800,
                        background: unit.status === 'EN_ROUTE' ? '#dcfce7' : unit.status === 'DELIVERING' ? '#eff6ff' : '#f1f5f9',
                        color: unit.status === 'EN_ROUTE' ? '#15803d' : unit.status === 'DELIVERING' ? '#1d4ed8' : '#475569',
                      }}>
                        {unit.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          setSelectedUnit(unit);
                          setTrackingModalOpen(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{
                          padding: '4px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        Live GPS
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <LiveTrackingModal
          isOpen={trackingModalOpen}
          onClose={() => setTrackingModalOpen(false)}
          taskData={selectedUnit}
        />
      </div>
    </DashboardLayout>
  );
}
