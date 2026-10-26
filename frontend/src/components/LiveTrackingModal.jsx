import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { getGoogleMapsNavigationUrl } from '../utils/gmapsUtils';
import { FALLBACK_MAP_TILE_DATA_URL } from './MapView';
import {
  VERIFIED_MISSION_ROAD_COORDS,
  VERIFIED_MISSION_STEPS,
} from '../utils/trichyVerifiedRoadCorridor';

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

// 120 Authenticated OpenStreetMap Road Waypoints for Trichy Delivery Corridor
const ROUTE_WAYPOINTS = VERIFIED_MISSION_ROAD_COORDS.map(([lat, lng], idx) => {
  let name = 'Tiruchchirappalli Bypass Flyover';
  if (idx > 95) name = 'Alvarthoppu Street -> Seva Sangam';
  else if (idx > 80) name = 'Madurai Road';
  else if (idx > 40) name = 'Nagapattinam - Gudalur - Mysore Road (Old NH67)';
  else if (idx === 0) name = 'SRM Hotel Pickup Gate';

  const isEndpoint = idx === 0 || idx === VERIFIED_MISSION_ROAD_COORDS.length - 1;
  const speed = isEndpoint ? 0 : Math.round(26 + Math.sin(idx * 0.35) * 8);

  return { lat, lng, name, speed };
});

export default function LiveTrackingModal({ isOpen, onClose, taskData }) {
  const [waypointIndex, setWaypointIndex] = useState(0);
  const [subProgress, setSubProgress] = useState(0); // 0 to 1 between waypoints
  const [currentCoord, setCurrentCoord] = useState(ROUTE_WAYPOINTS[0]);
  const [speed, setSpeed] = useState(28);
  const [batteryPct, setBatteryPct] = useState(86);
  const [haccpTemp, setHaccpTemp] = useState(4.2);
  const [isSimulating, setIsSimulating] = useState(true);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [etaSeconds, setEtaSeconds] = useState(260); // ~4m 20s
  const [headingAngle, setHeadingAngle] = useState(315); // degrees
  const mapRef = useRef(null);

  // Custom EV Vehicle Marker Icon with heading rotation
  const vehicleIcon = L.divIcon({
    className: 'custom-vehicle-marker',
    html: `
      <div style="
        transform: rotate(${headingAngle}deg);
        transition: transform 0.4s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        background: radial-gradient(circle, #059669 0%, #047857 70%);
        border: 3px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 4px 16px rgba(5, 150, 105, 0.5), 0 0 0 6px rgba(5, 150, 105, 0.2);
      ">
        <span style="font-size: 13px; font-weight: 800; color: #0284c7;">COURIER</span>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

  const pickupIcon = L.divIcon({
    className: 'pickup-flag-icon',
    html: `
      <div style="background: #2563eb; color: #fff; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 4px;">
        Pickup
      </div>
    `,
    iconSize: [60, 24],
    iconAnchor: [30, 12],
  });

  const shelterIcon = L.divIcon({
    className: 'shelter-flag-icon',
    html: `
      <div style="background: #ea580c; color: #fff; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 800; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 4px;">
        Shelter
      </div>
    `,
    iconSize: [64, 24],
    iconAnchor: [32, 12],
  });

  // Calculate heading angle between two coordinates
  const calculateBearing = (start, end) => {
    const lat1 = (start.lat * Math.PI) / 180;
    const lat2 = (end.lat * Math.PI) / 180;
    const dLng = ((end.lng - start.lng) * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    const brng = (Math.atan2(y, x) * 180) / Math.PI;
    return (brng + 360) % 360;
  };

  // Real-time animation loop
  useEffect(() => {
    if (!isOpen || !isSimulating) return;

    const interval = setInterval(() => {
      setWaypointIndex((wIdx) => {
        const nextIdx = (wIdx + 1) % (ROUTE_WAYPOINTS.length - 1);
        return nextIdx;
      });

      // Fluctuate telemetry values realistically
      setHaccpTemp((t) => +(4.0 + Math.sin(Date.now() / 3000) * 0.3).toFixed(1));
      setBatteryPct((b) => (b > 10 ? +(b - 0.01 * speedMultiplier).toFixed(1) : 86));
      setEtaSeconds((s) => (s > 5 ? s - Math.round(1.2 * speedMultiplier) : 260));
    }, Math.max(80, Math.round(350 / speedMultiplier)));

    return () => clearInterval(interval);
  }, [isOpen, isSimulating, speedMultiplier]);

  // Update exact lat/lng along authentic road waypoint vertices
  useEffect(() => {
    const p1 = ROUTE_WAYPOINTS[waypointIndex];
    const p2 = ROUTE_WAYPOINTS[waypointIndex + 1] || p1;
    setCurrentCoord(p1);

    const bearing = calculateBearing(p1, p2);
    setHeadingAngle(Math.round(bearing));
    setSpeed(p1.speed || 28);

    // Pan map smoothly to follow vehicle
    if (mapRef.current) {
      mapRef.current.panTo([p1.lat, p1.lng], { animate: true, duration: 0.3 });
    }
  }, [waypointIndex]);

  if (!isOpen) return null;

  const fullCoords = ROUTE_WAYPOINTS.map((w) => [w.lat, w.lng]);
  const formatEta = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const navUrl = getGoogleMapsNavigationUrl(
    ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].lat,
    ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].lng,
    'Trichy Seva Sangam'
  );

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '850px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-2xl)',
        }}
      >
        {/* Top Header with Live Signal Badge */}
        <div
          style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '999px',
                background: 'rgba(239, 68, 68, 0.25)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  boxShadow: '0 0 8px #ef4444',
                  animation: 'pulse 1.2s infinite',
                }}
              />
              LIVE GPS TELEMETRY
            </span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
              {taskData?.foodName || 'Banquet Meals Rescue'} • Task #
              {taskData?.id || '201'}
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#ffffff',
              fontSize: '18px',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            &times;
          </button>
        </div>

        {/* Live Telemetry HUD Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
            padding: '12px 18px',
            background: 'var(--color-surface)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Live ETA
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-primary)' }}>
              ETA: {formatEta(etaSeconds)}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Current Speed
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {speed} km/h
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              EV Battery
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: batteryPct < 20 ? '#ef4444' : '#10b981' }}>
              Battery: {batteryPct}%
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              HACCP Cold-Chain
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>
              Temp: {haccpTemp}°C
            </div>
          </div>
        </div>

        {/* Interactive Leaflet Radar Map */}
        <div style={{ position: 'relative', height: '380px', width: '100%' }}>
          <MapContainer
            center={[currentCoord.lat, currentCoord.lng]}
            zoom={14}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <MapInvalidator />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              subdomains={['a', 'b', 'c']}
              errorTileUrl={FALLBACK_MAP_TILE_DATA_URL}
              maxZoom={19}
            />

            {/* Complete Planned Route */}
            <Polyline
              positions={fullCoords}
              pathOptions={{ color: '#059669', weight: 5, opacity: 0.75, dashArray: '6, 8' }}
            />

            {/* Pickup Location Marker */}
            <Marker position={[ROUTE_WAYPOINTS[0].lat, ROUTE_WAYPOINTS[0].lng]} icon={pickupIcon}>
              <Popup>
                <strong>Pickup:</strong> SRM Hotel & Convention Centre<br />
                Banquet Meals (35 kg)
              </Popup>
            </Marker>

            {/* Destination Shelter Marker */}
            <Marker
              position={[
                ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].lat,
                ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1].lng,
              ]}
              icon={shelterIcon}
            >
              <Popup>
                <strong>Destination:</strong> Trichy Seva Sangam Shelter<br />
                Capacity: 120 Persons
              </Popup>
            </Marker>

            {/* Animated Vehicle Marker */}
            <Marker position={[currentCoord.lat, currentCoord.lng]} icon={vehicleIcon}>
              <Popup>
                <strong>Karthik Raja (Volunteer #1)</strong><br />
                Vehicle: EV Cargo Bike<br />
                Heading: {headingAngle}° • Speed: {speed} km/h
              </Popup>
            </Marker>

            {/* Radar Pulse Circle around Vehicle */}
            <Circle
              center={[currentCoord.lat, currentCoord.lng]}
              radius={180}
              pathOptions={{
                color: '#10b981',
                fillColor: '#10b981',
                fillOpacity: 0.12,
                weight: 1,
              }}
            />
          </MapContainer>

          {/* Floating Controls Overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '14px',
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(8px)',
              padding: '8px 12px',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
            }}
          >
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              style={{
                background: isSimulating ? '#059669' : '#64748b',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {isSimulating ? 'Pause GPS' : 'Resume GPS'}
            </button>

            <span style={{ color: 'var(--color-text-muted)' }}>Speed:</span>
            {[1, 2, 4].map((mult) => (
              <button
                key={mult}
                onClick={() => setSpeedMultiplier(mult)}
                style={{
                  background: speedMultiplier === mult ? '#2563eb' : '#e2e8f0',
                  color: speedMultiplier === mult ? '#fff' : '#334155',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontWeight: 700,
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

        {/* Action Footer */}
        <div
          style={{
            padding: '14px 20px',
            background: 'var(--color-surface)',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
            <span style={{ fontWeight: 700 }}>Next Milestone:</span>
            <span style={{ color: 'var(--color-text-muted)' }}>
              {ROUTE_WAYPOINTS[waypointIndex + 1]?.name || 'Approaching Destination'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <a
              href={navUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{ fontSize: '13px', padding: '8px 14px', textDecoration: 'none' }}
            >
              Open in Google Maps
            </a>
            <button
              onClick={() => alert('Calling Karthik Raja (+91 97890 11223)...')}
              className="btn btn-primary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              Call Driver
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
