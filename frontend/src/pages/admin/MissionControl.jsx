import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import DashboardLayout from '../../components/DashboardLayout';
import LiveTrackingModal from '../../components/LiveTrackingModal';
import LiveDispatchRadarModal from '../../components/LiveDispatchRadarModal';
import { playHaccpAlarm } from '../../utils/soundEffects';

const TRICHY_CENTER = [10.8050, 78.6950];

// Live fleet units roaming Trichy
const INITIAL_FLEET = [
  { id: 'EV-101', name: 'Karthik Raja', vehicle: 'EV Cargo Bike', battery: 84, lat: 10.7985, lng: 78.7010, speed: 28, status: 'EN_ROUTE', temp: 4.2 },
  { id: 'EV-102', name: 'Priya Sundaram', vehicle: 'EV Refrigerated Van', battery: 92, lat: 10.8140, lng: 78.7080, speed: 34, status: 'DELIVERING', temp: 3.8 },
  { id: 'EV-103', name: 'Senthil Kumar', vehicle: 'Cargo Auto', battery: 71, lat: 10.7910, lng: 78.6840, speed: 19, status: 'AVAILABLE', temp: 5.1 },
  { id: 'EV-104', name: 'Ananya Mehra', vehicle: 'EV Bike', battery: 65, lat: 10.8220, lng: 78.6940, speed: 24, status: 'EN_ROUTE', temp: 4.5 },
];

export default function MissionControl() {
  const [fleet, setFleet] = useState(INITIAL_FLEET);
  const [selectedUnit, setSelectedUnit] = useState(INITIAL_FLEET[0]);
  const [haccpAlert, setHaccpAlert] = useState(false);
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [radarModalOpen, setRadarModalOpen] = useState(false);
  const [tempHistory, setTempHistory] = useState([4.1, 4.3, 4.2, 4.0, 4.2, 4.4, 4.2]);
  const [activeTab, setActiveTab] = useState('radar'); // 'radar' or 'haccp'

  // Animate fleet coordinates slightly to show live movement
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
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: ${unit.status === 'EN_ROUTE' ? '#059669' : unit.status === 'DELIVERING' ? '#2563eb' : '#64748b'};
          border: 2px solid #ffffff;
          box-shadow: 0 0 12px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          cursor: pointer;
        ">
          ${unit.vehicle.includes('Van') ? '🚐' : '🛵'}
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

  return (
    <DashboardLayout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', color: 'var(--color-text-primary)' }}>
        {/* Top Header & Fast Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 10px #10b981',
                  animation: 'pulse 1.2s infinite',
                }}
              />
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800 }}>
                Mission Control & City Radar
              </h1>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Real-time fleet telematics, cold-chain monitoring, and autonomous dispatch command
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setRadarModalOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>🎯</span>
              <span>Trigger Dispatch Radar</span>
            </button>
            <button
              onClick={haccpAlert ? clearHaccpEmergency : triggerHaccpEmergency}
              className="btn"
              style={{
                fontSize: '13px',
                padding: '9px 16px',
                background: haccpAlert ? '#15803d' : '#dc2626',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {haccpAlert ? '✓ Resolve HACCP Breach' : '⚠️ Test Cold-Chain Breach'}
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
              <span style={{ fontSize: '32px' }}>🚨</span>
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
              ⚡ Autonomous Emergency Reroute
            </button>
          </div>
        )}

        {/* Real-Time Stats Overview HUD */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Active Fleet
            </span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-primary)' }}>
              4 / 4 Online
            </div>
            <span style={{ fontSize: '12px', color: '#10b981' }}>100% Operational</span>
          </div>

          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Average Response
            </span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--color-text-primary)' }}>
              3.4 mins
            </div>
            <span style={{ fontSize: '12px', color: '#059669' }}>VRPTW Optimized</span>
          </div>

          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Fleet Avg Battery
            </span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981' }}>
              78%
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Zero Tailpipe Emissions</span>
          </div>

          <div className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              HACCP Cargo Temp
            </span>
            <div style={{ fontSize: '26px', fontWeight: 900, color: haccpAlert ? '#ef4444' : '#0284c7' }}>
              {haccpAlert ? '13.5°C ⚠️' : '4.2°C ❄️'}
            </div>
            <span style={{ fontSize: '12px', color: haccpAlert ? '#ef4444' : '#059669' }}>
              {haccpAlert ? 'BREACH ALERT' : 'Normal Cold Chain'}
            </span>
          </div>
        </div>

        {/* Main Grid: Live Radar Map & Telemetry Streamer */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-4)' }}>
          {/* Live Full-City Radar Map */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              borderRadius: 'var(--radius-xl)',
              height: '520px',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                zIndex: 1000,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(8px)',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
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
              Trichy City Real-Time Logistics Grid
            </div>

            <MapContainer
              center={TRICHY_CENTER}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                      📡 View Live GPS Tracker
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Live Fleet Roster */}
            <div className="card" style={{ padding: '16px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                  Active Couriers ({fleet.length})
                </h3>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>● ALL STREAMING</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {fleet.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUnit(u);
                      setTrackingModalOpen(true);
                    }}
                    style={{
                      padding: '10px 12px',
                      background: selectedUnit.id === u.id ? 'rgba(5, 150, 105, 0.08)' : 'var(--color-bg)',
                      border: `1px solid ${selectedUnit.id === u.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700 }}>
                        {u.name} <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>({u.id})</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                        {u.vehicle} • {u.speed} km/h
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: u.battery < 20 ? '#ef4444' : '#10b981' }}>
                        🔋 {u.battery}%
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '999px',
                          background: u.status === 'EN_ROUTE' ? '#dcfce7' : '#e0e7ff',
                          color: u.status === 'EN_ROUTE' ? '#15803d' : '#3730a3',
                          fontWeight: 700,
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
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800 }}>
                  IoT HACCP Thermal Stream
                </h4>
                <span style={{ fontSize: '11px', fontWeight: 700, color: haccpAlert ? '#ef4444' : '#0284c7' }}>
                  {tempHistory[tempHistory.length - 1]}°C
                </span>
              </div>

              {/* Simulated Oscilloscope Bar Chart */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '6px',
                  height: '70px',
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
                  color: 'var(--color-text-muted)',
                  marginTop: '4px',
                }}
              >
                <span>-10s</span>
                <span>Safe Threshold: &lt; 5°C</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <LiveTrackingModal
          isOpen={trackingModalOpen}
          onClose={() => setTrackingModalOpen(false)}
          taskData={selectedUnit}
        />

        <LiveDispatchRadarModal
          isOpen={radarModalOpen}
          onClose={() => setRadarModalOpen(false)}
          onAcceptTask={(task) => {
            alert(`Task #${task.id} (${task.foodName}) successfully assigned to Karthik Raja!`);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
