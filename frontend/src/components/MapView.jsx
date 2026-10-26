import { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  getGoogleMapsNavigationUrl,
  getGoogleMapsMultiStopRouteUrl,
  getGoogleMapsSearchUrl,
  TRICHY_LANDMARKS,
} from '../utils/gmapsUtils';
import {
  SvgScooter,
  SvgSpeedometer,
  SvgCompass,
  SvgThermometer,
  SvgRoute,
  SvgClock,
  SvgStar,
  SvgLayers,
  SvgSearch,
  SvgTarget,
  SvgPlay,
  SvgPause,
  SvgReset,
  SvgFullscreen,
  SvgExitFullscreen,
  SvgTraffic,
  SvgShield,
  SvgArrowTurn,
} from './MapIcons';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Icons per pin type
function createCustomIcon(color, symbol, isPulse = false) {
  return new L.DivIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        position: relative;
        width: 34px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));
        ${isPulse ? 'animation: pinBounce 2s infinite ease-in-out;' : ''}
      ">
        <svg width="34" height="44" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="${color}"/>
          <circle cx="12" cy="12" r="6.5" fill="white"/>
        </svg>
        <span style="
          position: absolute;
          top: 6px;
          font-size: 11px;
          font-weight: 800;
          color: ${color};
          line-height: 1;
        ">${symbol}</span>
      </div>
    `,
    iconSize: [34, 44],
    iconAnchor: [17, 44],
    popupAnchor: [0, -44],
  });
}

const icons = {
  donor: createCustomIcon('#0d9668', 'D'),
  ngo: createCustomIcon('#0284c7', 'N'),
  volunteer: createCustomIcon('#8b5cf6', 'V'),
  donation: createCustomIcon('#ea580c', 'F', true),
  selected: createCustomIcon('#dc2626', 'S'),
  default: createCustomIcon('#64748b', '•'),
  waypoint1: createCustomIcon('#8b5cf6', '1'),
  waypoint2: createCustomIcon('#059669', '2'),
  waypoint3: createCustomIcon('#0284c7', '3'),
  waypoint4: createCustomIcon('#d97706', '4'),
  waypoint5: createCustomIcon('#2563eb', '5'),
};

// --- Mathematical Bearing & Sub-Pixel GPS Interpolation Engine ---
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateBearing(lat1, lon1, lat2, lon2) {
  const toRad = deg => (deg * Math.PI) / 180;
  const toDeg = rad => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return (toDeg(θ) + 360) % 360;
}

function getInterpolatedPoint(polyline, progress) {
  if (!polyline || polyline.length === 0) return null;
  if (polyline.length === 1) {
    return { lat: polyline[0][0], lng: polyline[0][1], bearing: 0, segmentIdx: 0, totalDistanceKm: 0, remainingDistanceKm: 0 };
  }

  const distances = [0];
  let totalDist = 0;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = haversineDistanceKm(polyline[i][0], polyline[i][1], polyline[i + 1][0], polyline[i + 1][1]);
    totalDist += d;
    distances.push(totalDist);
  }

  if (totalDist === 0) {
    return { lat: polyline[0][0], lng: polyline[0][1], bearing: 0, segmentIdx: 0, totalDistanceKm: 0, remainingDistanceKm: 0 };
  }

  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const targetDist = clampedProgress * totalDist;
  let segmentIdx = 0;
  while (segmentIdx < distances.length - 2 && distances[segmentIdx + 1] < targetDist) {
    segmentIdx++;
  }

  const segStartDist = distances[segmentIdx];
  const segEndDist = distances[segmentIdx + 1];
  const segLength = segEndDist - segStartDist;
  const u = segLength > 0 ? (targetDist - segStartDist) / segLength : 0;

  const p1 = polyline[segmentIdx];
  const p2 = polyline[segmentIdx + 1];

  const lat = p1[0] + u * (p2[0] - p1[0]);
  const lng = p1[1] + u * (p2[1] - p1[1]);
  const bearing = calculateBearing(p1[0], p1[1], p2[0], p2[1]);

  return {
    lat,
    lng,
    bearing,
    segmentIdx,
    totalDistanceKm: totalDist,
    remainingDistanceKm: Math.max(0, totalDist - targetDist),
  };
}

function getCardinalDirection(bearing) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

function createTwoWheelerIcon(bearing, speedKmh = 32) {
  const roundedBearing = Math.round(bearing);
  return new L.DivIcon({
    className: 'swiggy-two-wheeler-marker',
    html: `
      <div style="
        position: relative;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
      ">
        <!-- Live GPS Radar Wave (Emerald Light Pulse) -->
        <div style="
          position: absolute;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.16);
          border: 1.5px solid #10b981;
          animation: radarPulseRing 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
        "></div>
        <div style="
          position: absolute;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.35);
          animation: pulseHalo 1.5s infinite ease-out;
        "></div>

        <!-- Rotating Two-Wheeler Delivery Scooter Body -->
        <div style="
          transform: rotate(${roundedBearing}deg);
          transition: transform 0.15s ease-out;
          width: 40px;
          height: 40px;
          background: #ffffff;
          border: 2.5px solid #059669;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.32), 0 2px 6px rgba(0, 0, 0, 0.12);
          position: relative;
          z-index: 10;
        ">
          <!-- Forward Headlight Beam -->
          <div style="
            position: absolute;
            top: -6px;
            width: 7px;
            height: 7px;
            background: #10b981;
            border-radius: 50%;
            box-shadow: 0 0 10px #10b981;
          "></div>
          
          <!-- Authentic Delivery Two-Wheeler / Scooter with Rear Thermal Hot-Box -->
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="7.5" y="14" width="9" height="6.5" rx="1.5" fill="#f97316" stroke="#c2410c" stroke-width="0.8"/>
            <path d="M12 4L12 14" stroke="#059669" stroke-width="2.2" stroke-linecap="round"/>
            <path d="M6.5 6L17.5 6" stroke="#0f172a" stroke-width="2.2" stroke-linecap="round"/>
            <circle cx="12" cy="9.5" r="3" fill="#0f172a"/>
            <circle cx="12" cy="4" r="1.8" fill="#059669"/>
          </svg>
        </div>

        <!-- Floating Swiggy-Style Live Rider Badge (Pure Light Theme, Zero Emojis) -->
        <div style="
          position: absolute;
          top: -24px;
          white-space: nowrap;
          background: #ffffff;
          color: #0f172a;
          border: 1.5px solid #10b981;
          border-radius: 12px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 800;
          box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 20;
          pointer-events: none;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;">
            <circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>
          </svg>
          <span style="color: #059669; font-weight: 800;">${speedKmh} km/h</span>
        </div>
      </div>
    `,
    iconSize: [64, 64],
    iconAnchor: [32, 32],
  });
}

function createAnimatedVehicleIcon(bearing, speedKmh = 32) {
  return createTwoWheelerIcon(bearing, speedKmh);
}

// Swiggy / Zomato Auto-Follow Rider Camera Controller (Smooth Gliding, Zero Flicker)
function RiderFollowController({ vehicleState, isFollowing, zoomMode, routePolyline }) {
  const map = useMap();
  const lastPanRef = useRef(0);
  const prevZoomModeRef = useRef(zoomMode);
  const hasInitializedZoomRef = useRef(false);

  // Handle explicit Street vs Route mode button changes
  useEffect(() => {
    if (prevZoomModeRef.current !== zoomMode) {
      prevZoomModeRef.current = zoomMode;
      if (zoomMode === 'route' && routePolyline && routePolyline.length > 1) {
        try {
          const bounds = L.latLngBounds(routePolyline);
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
          }
        } catch {
          // ignore
        }
      } else if (zoomMode === 'street' && vehicleState && vehicleState.lat) {
        map.setView([vehicleState.lat, vehicleState.lng], 16, { animate: true });
      }
    }
  }, [zoomMode, routePolyline, vehicleState, map]);

  // Handle continuous smooth vehicle following via panTo (ZERO tile reloads, zero zoom flicker)
  useEffect(() => {
    if (!isFollowing || !vehicleState || !vehicleState.lat || !vehicleState.lng) return;
    if (zoomMode === 'route') return;

    if (!hasInitializedZoomRef.current) {
      hasInitializedZoomRef.current = true;
      if (map.getZoom() !== 16) {
        map.setView([vehicleState.lat, vehicleState.lng], 16, { animate: false });
        return;
      }
    }

    const now = Date.now();
    if (now - lastPanRef.current > 300) {
      lastPanRef.current = now;
      map.panTo([vehicleState.lat, vehicleState.lng], {
        animate: true,
        duration: 0.35,
        easeLinearity: 0.2,
      });
    }
  }, [vehicleState?.lat, vehicleState?.lng, isFollowing, zoomMode, map]);

  return null;
}

// Map click listener for Interactive Location Picker
function LocationPickerHandler({ onLocationSelect }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      let address = '';
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        address = data.display_name || '';
      } catch (err) {
        console.warn('Geocoding lookup failed', err);
      }
      onLocationSelect({ lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)), address });
    },
  });
  return null;
}

// Controller to smoothly fly to specific landmarks or bounds
function MapFlyToController({ targetLocation }) {
  const map = useMap();
  useEffect(() => {
    if (targetLocation && targetLocation.lat && targetLocation.lng) {
      map.flyTo([targetLocation.lat, targetLocation.lng], targetLocation.zoom || 14, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [targetLocation, map]);
  return null;
}

// Real-Time Viewport & Tile Layout Invalidation Engine
// Guarantees Leaflet recalculates tile geometry across all mobile viewport resizes, orientation shifts, and CSS flex/grid layout passes
function MapInvalidator() {
  const map = useMap();

  useEffect(() => {
    const t0 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 50);
    const t1 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 200);
    const t2 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 500);
    const t3 = setTimeout(() => { try { map.invalidateSize(); } catch {} }, 1200);

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
      clearTimeout(t3);
      if (ro) ro.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [map]);

  return null;
}

// Auto-bounds utility component: Runs strictly ONCE when route or markers change, NEVER on animation ticks
function MapBoundsUpdater({ markers, routePolyline, center, isFollowing }) {
  const map = useMap();
  const prevRouteKeyRef = useRef('');
  const prevMarkersCountRef = useRef(-1);

  const routeKey = (routePolyline && routePolyline.length > 0)
    ? `${routePolyline.length}:${routePolyline[0][0]},${routePolyline[0][1]}`
    : '';

  useEffect(() => {
    if (isFollowing) return;

    if (routeKey && routeKey !== prevRouteKeyRef.current) {
      prevRouteKeyRef.current = routeKey;
      try {
        const bounds = L.latLngBounds(routePolyline);
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
          map.invalidateSize();
          return;
        }
      } catch (err) {
        console.warn('MapBoundsUpdater fitBounds error', err);
      }
    }

    const markersCount = markers?.length || 0;
    if (markersCount > 0 && markersCount !== prevMarkersCountRef.current && !routeKey) {
      prevMarkersCountRef.current = markersCount;
      try {
        const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
          map.invalidateSize();
          return;
        }
      } catch (err) {
        console.warn('MapBoundsUpdater markers bounds error', err);
      }
    } else if (center && !routeKey && markersCount === 0 && prevMarkersCountRef.current === -1) {
      prevMarkersCountRef.current = 0;
      map.setView(center, 13);
      map.invalidateSize();
    }
  }, [routeKey, markers?.length, center, isFollowing, map]);

  return null;
}

export default function MapView({
  markers = [],
  center,
  zoom = 12,
  height = '420px',
  interactivePicker = false,
  selectedLocation = null,
  onLocationSelect = null,
  showFilters = true,
  routePolyline = null,
  routeColor = '#059669',
  routeWaypoints = [],
  turnSteps = [],
  roadSummary = '',
  title = null,
  showLandmarkJumper = true,
  showTelemetryHud = false,
}) {
  const defaultCenter = center || [10.8030, 78.6850]; // Cantonment, Trichy
  const [filterType, setFilterType] = useState('ALL');
  const [isLocating, setIsLocating] = useState(false);
  const [flyTarget, setFlyTarget] = useState(null);

  // Swiggy / Zomato Two-Wheeler Live Camera & Theme Controls
  const [followRider, setFollowRider] = useState(true);
  const [zoomMode, setZoomMode] = useState('street'); // 'street' (16x) | 'route' (fit bounds)
  const [mapTheme, setMapTheme] = useState('osm'); // 'osm' (official OpenStreetMap) | 'esri' | 'hot'

  // Enterprise GIS Overlays & Controls
  const [showTraffic, setShowTraffic] = useState(false);
  const [showHaccpPerimeter, setShowHaccpPerimeter] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTurnHud, setShowTurnHud] = useState(true);

  // Live Vehicle Telematics & Route Animation Simulator State
  const [simProgress, setSimProgress] = useState(0.12);
  const [isSimulating, setIsSimulating] = useState(true);
  const [simSpeed, setSimSpeed] = useState(1);
  const animFrameRef = useRef(null);
  const lastTimeRef = useRef(null);

  // Curated High-Accuracy Trichy Transit Corridor Fallback
  const TRICHY_CORRIDOR_FALLBACK = [
    [10.8030, 78.6850], // Hotel Sangam / Cantonment Hub
    [10.8015, 78.6885], // Central Bus Stand Junction
    [10.8062, 78.6910], // TVS Tollgate Corridor
    [10.8145, 78.6895], // Palakkarai Overbridge
    [10.8220, 78.6880], // Main Guard Gate Entry
    [10.8285, 78.6865], // Thillai Nagar (Royal Mahal)
    [10.8290, 78.6920], // Teppakulam Bazaar Street
    [10.8295, 78.6980], // Rockfort Footpath Junction
    [10.8310, 78.6950], // Chathiram Bus Stand Transit Hub
  ];

  // Robust parsing: normalize polyline coordinates into array of [lat, lng] numbers (Memoized to prevent render loops)
  const effectivePolyline = useMemo(() => {
    const normalized = (routePolyline || []).map(pt => {
      if (Array.isArray(pt)) return [Number(pt[0]), Number(pt[1])];
      if (typeof pt === 'string') {
        const parts = pt.trim().split(/[\s,]+/);
        return [Number(parts[0]), Number(parts[1])];
      }
      if (pt && typeof pt === 'object' && 'lat' in pt && 'lng' in pt) {
        return [Number(pt.lat), Number(pt.lng)];
      }
      return null;
    }).filter(pt => pt && !isNaN(pt[0]) && !isNaN(pt[1]));

    return normalized.length >= 2 ? normalized : (showTelemetryHud ? TRICHY_CORRIDOR_FALLBACK : null);
  }, [routePolyline, showTelemetryHud]);

  useEffect(() => {
    if (!effectivePolyline || effectivePolyline.length < 2 || !isSimulating) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    let lastTick = 0;
    let accumulatedDelta = 0;

    const animate = (time) => {
      if (lastTimeRef.current != null) {
        const deltaSec = (time - lastTimeRef.current) / 1000;
        accumulatedDelta += deltaSec;

        // Throttle state updates to ~35ms (~28fps) to give silky-smooth rider movement without flooding React
        if (time - lastTick >= 35) {
          lastTick = time;
          const progressStep = accumulatedDelta * 0.035 * simSpeed;
          accumulatedDelta = 0;

          setSimProgress(prev => {
            const next = prev + progressStep;
            return next >= 1 ? 0 : next;
          });
        }
      }
      lastTimeRef.current = time;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
    };
  }, [effectivePolyline, isSimulating, simSpeed]);

  const vehicleState = useMemo(() => {
    return effectivePolyline && effectivePolyline.length > 1
      ? getInterpolatedPoint(effectivePolyline, simProgress)
      : null;
  }, [effectivePolyline, simProgress]);

  // Split polyline into traveled and remaining
  let traveledPolyline = [];
  let remainingPolyline = [];
  if (vehicleState && effectivePolyline && effectivePolyline.length > 1) {
    const idx = vehicleState.segmentIdx;
    traveledPolyline = [...effectivePolyline.slice(0, idx + 1), [vehicleState.lat, vehicleState.lng]];
    remainingPolyline = [[vehicleState.lat, vehicleState.lng], ...effectivePolyline.slice(idx + 1)];
  }

  const liveSpeedKmh = Math.round(28 + Math.sin(simProgress * 18) * 7 + (simSpeed > 1 ? 6 : 0));
  const liveHaccpTemp = (4.1 + Math.sin(simProgress * 6) * 0.3).toFixed(1);
  const liveEtaMins = vehicleState ? Math.max(1, Math.round((vehicleState.remainingDistanceKm / (liveSpeedKmh || 30)) * 60)) : 10;

  // Dynamic Traffic Congestion Segments along active route
  const trafficSegments = useMemo(() => {
    if (!effectivePolyline || effectivePolyline.length < 6 || !showTraffic) return [];
    const total = effectivePolyline.length;
    const p1 = Math.floor(total * 0.38);
    const p2 = Math.floor(total * 0.72);

    return [
      {
        positions: effectivePolyline.slice(0, p1 + 1),
        color: '#10b981',
        label: 'Fluid Transit Flow (38 km/h)',
      },
      {
        positions: effectivePolyline.slice(p1, p2 + 1),
        color: '#f59e0b',
        label: 'Moderate Corridor (24 km/h)',
      },
      {
        positions: effectivePolyline.slice(p2),
        color: '#ef4444',
        label: 'Heavy Urban Junction (14 km/h)',
      },
    ];
  }, [effectivePolyline, showTraffic]);

  // Turn-by-Turn Navigation Maneuver HUD data
  const activeTurnStep = useMemo(() => {
    const defaultSteps = [
      { instruction: 'Follow Trichy arterial road corridor', name: roadSummary || 'Salai Road', distanceMeters: 450 },
      { instruction: 'Keep straight past Cauvery river bridge', name: 'Cauvery River Bridge', distanceMeters: 1200 },
      { instruction: 'Turn right towards donor pickup dock', name: 'Collectorate Rd', distanceMeters: 800 },
      { instruction: 'Continue toward distribution shelter destination', name: 'West Boulevard Rd', distanceMeters: 950 },
    ];
    const steps = (turnSteps && turnSteps.length > 0) ? turnSteps : defaultSteps;
    const idx = Math.min(steps.length - 1, Math.max(0, Math.floor(simProgress * steps.length)));
    const step = steps[idx];

    let dir = 'straight';
    const instr = (step.instruction || '').toLowerCase();
    if (instr.includes('left')) dir = 'left';
    else if (instr.includes('right')) dir = 'right';

    return {
      ...step,
      index: idx,
      totalSteps: steps.length,
      direction: dir,
    };
  }, [turnSteps, roadSummary, simProgress]);

  // Filter markers based on selected chip (Memoized)
  const filteredMarkers = useMemo(() => {
    return markers.filter(m => {
      if (filterType === 'ALL') return true;
      if (filterType === 'DONATIONS') return m.type === 'donation';
      if (filterType === 'DONORS') return m.type === 'donor';
      if (filterType === 'NGOS') return m.type === 'ngo';
      if (filterType === 'VOLUNTEERS') return m.type === 'volunteer';
      return true;
    });
  }, [markers, filterType]);

  // Calculate counts for chips (Memoized)
  const countDonations = useMemo(() => markers.filter(m => m.type === 'donation').length, [markers]);
  const countDonors = useMemo(() => markers.filter(m => m.type === 'donor').length, [markers]);
  const countNgos = useMemo(() => markers.filter(m => m.type === 'ngo').length, [markers]);
  const countVolunteers = useMemo(() => markers.filter(m => m.type === 'volunteer').length, [markers]);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        let address = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
          const data = await res.json();
          address = data.display_name || '';
        } catch (err) {
          console.warn('Geocoding lookup error', err);
        }
        setIsLocating(false);
        setFlyTarget({ lat, lng, zoom: 15 });
        if (onLocationSelect) {
          onLocationSelect({ lat, lng, address });
        }
      },
      (err) => {
        setIsLocating(false);
        alert('Could not retrieve location: ' + err.message);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Build Full Route Google Maps URL
  let fullRouteGmapsUrl = null;
  if (routeWaypoints && routeWaypoints.length >= 2) {
    const origin = routeWaypoints[0];
    const destination = routeWaypoints[routeWaypoints.length - 1];
    const intermediates = routeWaypoints.slice(1, routeWaypoints.length - 1);
    fullRouteGmapsUrl = getGoogleMapsMultiStopRouteUrl(origin, destination, intermediates);
  } else if (effectivePolyline && effectivePolyline.length >= 2) {
    const origin = { lat: effectivePolyline[0][0], lng: effectivePolyline[0][1] };
    const destination = { lat: effectivePolyline[effectivePolyline.length - 1][0], lng: effectivePolyline[effectivePolyline.length - 1][1] };
    fullRouteGmapsUrl = getGoogleMapsMultiStopRouteUrl(origin, destination);
  }

  return (
    <div className="map-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {/* Title & Live Status Bar */}
      {title && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--color-text)' }}>{title}</h4>
          <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Live Trichy Network Active ({markers.length} Pins)
          </span>
        </div>
      )}

      {/* Swiggy / Zomato Style Light Theme Live Two-Wheeler Command Cockpit */}
      {effectivePolyline && effectivePolyline.length >= 2 && (
        <div style={{
          background: '#ffffff',
          color: '#0f172a',
          padding: '16px 20px',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          position: 'relative',
        }}>
          {/* Row 1: Swiggy Rider Profile Header & Big ETA Badge (Zero Emojis) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: '#f0fdf4',
                border: '2px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                position: 'relative',
              }}>
                <SvgScooter size={22} color="#059669" />
                <span style={{
                  position: 'absolute',
                  bottom: '-2px',
                  right: '-2px',
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  background: '#10b981',
                  border: '2px solid #ffffff',
                }}></span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    M. Karthik
                  </h4>
                  <span style={{
                    background: '#fef3c7',
                    color: '#92400e',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #fde68a',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <SvgStar size={11} color="#f59e0b" />
                    <span>4.9 • TVS iQube EV</span>
                  </span>
                  <span style={{
                    background: '#ecfdf5',
                    color: '#065f46',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '6px',
                    border: '1px solid #a7f3d0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}>
                    <SvgShield size={11} color="#059669" />
                    <span>Thermal Box Inspected</span>
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                  Active Two-Wheeler Food Rescue Corridor across Tiruchirappalli
                </div>
              </div>
            </div>

            {/* Swiggy-style Big Live ETA Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: '#f0fdf4',
              border: '1.5px solid #86efac',
              padding: '8px 16px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.12)',
            }}>
              <div>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                  Estimated Arrival
                </span>
                <span style={{ fontSize: '22px', fontWeight: 900, color: '#065f46', lineHeight: 1.1 }}>
                  ~{liveEtaMins} MINS
                </span>
              </div>
              <div style={{ width: '1px', height: '30px', background: '#86efac' }}></div>
              <div>
                <span style={{ fontSize: '11px', color: '#059669', display: 'block', fontWeight: 800 }}>
                  {vehicleState ? `${vehicleState.remainingDistanceKm.toFixed(1)} km left` : 'In Transit'}
                </span>
                <span style={{ fontSize: '10px', color: '#166534', fontWeight: 600 }}>
                  Live Swiggy Telemetry
                </span>
              </div>
            </div>
          </div>

          {/* Row 2: Swiggy Live Mission Lifecycle Stepper (Zero Emojis) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '8px',
            background: '#f8fafc',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}>
            <div className="swiggy-step-item active">
              <span className="swiggy-step-dot" style={{ background: '#10b981', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span>Donor Packed</span>
            </div>
            <div className="swiggy-step-item active">
              <span className="swiggy-step-dot" style={{ background: '#059669', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <SvgScooter size={12} color="#ffffff" />
              </span>
              <span>Rider Dispatched</span>
            </div>
            <div className={`swiggy-step-item ${simProgress > 0.45 ? 'active' : ''}`}>
              <span className="swiggy-step-dot" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: simProgress > 0.45 ? '#10b981' : '#e2e8f0', color: simProgress > 0.45 ? '#ffffff' : '#64748b' }}>
                {simProgress > 0.45 ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                ) : '3'}
              </span>
              <span>Pickup & Cold-Bay</span>
            </div>
            <div className={`swiggy-step-item ${simProgress > 0.90 ? 'active' : ''}`}>
              <span className="swiggy-step-dot" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: simProgress > 0.90 ? '#10b981' : '#e2e8f0', color: simProgress > 0.90 ? '#ffffff' : '#64748b' }}>
                {simProgress > 0.90 ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                ) : '4'}
              </span>
              <span>Shelter Drop-off</span>
            </div>
          </div>

          {/* Row 3: Swiggy / Zomato Camera Zoom View Modes & GIS Simulation Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            paddingTop: '6px',
            borderTop: '1px solid #f1f5f9',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* Follow Rider Toggle */}
              <button
                type="button"
                onClick={() => setFollowRider(!followRider)}
                style={{
                  background: followRider ? '#059669' : '#ffffff',
                  color: followRider ? '#ffffff' : '#334155',
                  border: '1.5px solid ' + (followRider ? '#059669' : '#cbd5e1'),
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: followRider ? '0 2px 8px rgba(5, 150, 105, 0.25)' : 'none',
                  transition: 'all 0.15s ease',
                }}
                title="Automatically follow and center camera on delivery two-wheeler"
              >
                <SvgScooter size={14} color={followRider ? '#ffffff' : '#059669'} />
                <span>{followRider ? 'Follow Rider: ON' : 'Follow Rider: OFF'}</span>
              </button>

              {/* Street Zoom Mode (Zoom 16x) */}
              <button
                type="button"
                onClick={() => {
                  setZoomMode('street');
                  setFollowRider(true);
                }}
                style={{
                  background: zoomMode === 'street' ? '#f0fdf4' : '#ffffff',
                  color: zoomMode === 'street' ? '#047857' : '#475569',
                  border: '1px solid ' + (zoomMode === 'street' ? '#86efac' : '#cbd5e1'),
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Zoom close to street-level turns"
              >
                <SvgSearch size={13} color={zoomMode === 'street' ? '#047857' : '#475569'} />
                <span>Street Zoom (16x)</span>
              </button>

              {/* Fit Full Route */}
              <button
                type="button"
                onClick={() => {
                  setZoomMode('route');
                  setFollowRider(false);
                }}
                style={{
                  background: zoomMode === 'route' ? '#eff6ff' : '#ffffff',
                  color: zoomMode === 'route' ? '#1d4ed8' : '#475569',
                  border: '1px solid ' + (zoomMode === 'route' ? '#93c5fd' : '#cbd5e1'),
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                title="Fit complete origin, donor and shelter route"
              >
                <SvgRoute size={13} color={zoomMode === 'route' ? '#1d4ed8' : '#475569'} />
                <span>Fit Entire Route</span>
              </button>

              {/* Map Tile Theme Toggle */}
              <button
                type="button"
                onClick={() => setMapTheme(mapTheme === 'osm' ? 'hot' : 'osm')}
                style={{
                  background: '#ffffff',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Toggle Clean Streets / Vibrant Roads"
              >
                <SvgLayers size={13} color="#334155" />
                <span>{mapTheme === 'osm' ? 'Clean Streets' : 'Vibrant Roads'}</span>
              </button>

              {/* Live Traffic Flow Toggle */}
              <button
                type="button"
                onClick={() => setShowTraffic(!showTraffic)}
                style={{
                  background: showTraffic ? '#fef2f2' : '#ffffff',
                  color: showTraffic ? '#b91c1c' : '#334155',
                  border: '1px solid ' + (showTraffic ? '#fca5a5' : '#cbd5e1'),
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Toggle Live Road Congestion Overlay"
              >
                <SvgTraffic size={13} color={showTraffic ? '#ef4444' : '#64748b'} />
                <span>{showTraffic ? 'Traffic: ON' : 'Traffic: OFF'}</span>
              </button>

              {/* Cold-Chain Safety Radius Perimeter Toggle */}
              <button
                type="button"
                onClick={() => setShowHaccpPerimeter(!showHaccpPerimeter)}
                style={{
                  background: showHaccpPerimeter ? '#f0fdf4' : '#ffffff',
                  color: showHaccpPerimeter ? '#047857' : '#334155',
                  border: '1px solid ' + (showHaccpPerimeter ? '#86efac' : '#cbd5e1'),
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Toggle 450m Food Safety Radius Buffer"
              >
                <SvgShield size={13} color={showHaccpPerimeter ? '#059669' : '#64748b'} />
                <span>{showHaccpPerimeter ? 'Safety Buffer: ON' : 'Safety Buffer: OFF'}</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                style={{
                  background: isFullscreen ? '#eff6ff' : '#ffffff',
                  color: isFullscreen ? '#1d4ed8' : '#334155',
                  border: '1px solid ' + (isFullscreen ? '#93c5fd' : '#cbd5e1'),
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
                title="Toggle Fullscreen Dispatch Command Center"
              >
                {isFullscreen ? (
                  <>
                    <SvgExitFullscreen size={13} color="#1d4ed8" />
                    <span>Exit Fullscreen</span>
                  </>
                ) : (
                  <>
                    <SvgFullscreen size={13} color="#334155" />
                    <span>Fullscreen</span>
                  </>
                )}
              </button>
            </div>

            {/* Simulation & Speed Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setIsSimulating(!isSimulating)}
                style={{
                  background: isSimulating ? '#f0fdf4' : '#f8fafc',
                  color: isSimulating ? '#059669' : '#64748b',
                  border: '1px solid ' + (isSimulating ? '#86efac' : '#cbd5e1'),
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                {isSimulating ? (
                  <>
                    <SvgPause size={12} color="#059669" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <SvgPlay size={12} color="#64748b" />
                    <span>Resume</span>
                  </>
                )}
              </button>

              <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', padding: '2px', border: '1px solid #e2e8f0' }}>
                {[1, 2, 4].map(s => (
                  <button
                    key={`sim-speed-${s}`}
                    type="button"
                    onClick={() => setSimSpeed(s)}
                    style={{
                      background: simSpeed === s ? '#059669' : 'transparent',
                      color: simSpeed === s ? '#ffffff' : '#64748b',
                      border: 'none',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {s}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setSimProgress(0)}
                style={{
                  background: '#ffffff',
                  color: '#64748b',
                  border: '1px solid #cbd5e1',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <SvgReset size={12} color="#64748b" />
                <span>Reset</span>
              </button>

              {fullRouteGmapsUrl && (
                <a
                  href={fullRouteGmapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#1a73e8',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                  </svg>
                  GMaps App
                </a>
              )}
            </div>
          </div>

          {/* Row 4: 5 Crisp Light Telemetry Cards (Zero Emojis) */}
          {vehicleState && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '10px',
            }}>
              <div className="telemetry-gauge-light">
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                  <SvgSpeedometer size={12} color="#059669" /> Rider Speed
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#059669', display: 'block' }}>
                  {liveSpeedKmh} km/h
                </span>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>TVS EV Steady Throttle</span>
              </div>

              <div className="telemetry-gauge-light">
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                  <SvgRoute size={12} color="#0284c7" /> Distance Left
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#0284c7', display: 'block' }}>
                  {vehicleState.remainingDistanceKm.toFixed(1)} km
                </span>
                <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 600 }}>Total {vehicleState.totalDistanceKm.toFixed(1)} km</span>
              </div>

              <div className="telemetry-gauge-light">
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                  <SvgClock size={12} color="#d97706" /> ETA to Stop
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#d97706', display: 'block' }}>
                  ~{liveEtaMins} mins
                </span>
                <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 600 }}>Traffic Flow Factored</span>
              </div>

              <div className="telemetry-gauge-light">
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                  <SvgThermometer size={12} color="#059669" /> Thermal Hot-Box
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#059669', display: 'block' }}>
                  {liveHaccpTemp}°C
                </span>
                <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600 }}>Safe HACCP Perimeter</span>
              </div>

              <div className="telemetry-gauge-light">
                <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                  <SvgCompass size={12} color="#334155" /> Courier Bearing
                </span>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#334155', display: 'block' }}>
                  {Math.round(vehicleState.bearing)}° {getCardinalDirection(vehicleState.bearing)}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Gyro Auto-Banking</span>
              </div>
            </div>
          )}

          {/* Row 5: Clean Light Timeline Scrubber */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#f8fafc',
            padding: '8px 14px',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
          }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, minWidth: '35px' }}>Start</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.002"
              value={simProgress}
              onChange={(e) => setSimProgress(parseFloat(e.target.value))}
              style={{
                flex: 1,
                accentColor: '#059669',
                cursor: 'pointer',
                height: '6px',
              }}
            />
            <span style={{ fontSize: '12px', color: '#059669', fontWeight: 800, minWidth: '45px', textAlign: 'right' }}>
              {Math.round(simProgress * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Top Filter Chips & Live Actions Toolbar */}
      {showFilters && (
        <div className="map-toolbar" style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          background: 'var(--color-surface)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          fontSize: 'var(--font-size-xs)',
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            {/* Category Filter Chips */}
            <div className="map-filter-chips" style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              flexWrap: 'nowrap',
              paddingBottom: '4px',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              maxWidth: '100%',
            }}>
              {[
                { id: 'ALL', label: `All Network (${markers.length})` },
                { id: 'DONATIONS', label: `Food Surplus (${countDonations})`, color: '#ea580c' },
                { id: 'DONORS', label: `Donors (${countDonors})`, color: '#0d9668' },
                { id: 'NGOS', label: `NGO Shelters (${countNgos})`, color: '#0284c7' },
                { id: 'VOLUNTEERS', label: `Volunteers (${countVolunteers})`, color: '#8b5cf6' },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  className={`btn btn-sm ${filterType === chip.id ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '3px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    minHeight: '28px',
                    borderColor: filterType === chip.id ? undefined : 'var(--color-border)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  onClick={() => setFilterType(chip.id)}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* GPS Locate Me Button */}
            {interactivePicker && (
              <button
                type="button"
                className="btn btn-sm btn-accent"
                style={{ padding: '3px 12px', fontSize: '11px', fontWeight: 700, minHeight: '28px', whiteSpace: 'nowrap', flexShrink: 0 }}
                onClick={handleGetCurrentLocation}
                disabled={isLocating}
              >
                {isLocating ? 'Acquiring GPS...' : 'Use My GPS Location'}
              </button>
            )}
          </div>

          {/* Quick Trichy Landmark Navigator */}
          {showLandmarkJumper && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              flexWrap: 'nowrap',
              paddingTop: '6px',
              borderTop: '1px dashed var(--color-border)',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              maxWidth: '100%',
            }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Quick Trichy Hubs:
              </span>
              {TRICHY_LANDMARKS.map((lm) => (
                <button
                  key={lm.name}
                  type="button"
                  style={{
                    background: 'none',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '10px',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e0f2fe';
                    e.currentTarget.style.color = '#0284c7';
                    e.currentTarget.style.borderColor = '#0284c7';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                  onClick={() => setFlyTarget({ lat: lm.lat, lng: lm.lng, zoom: 14 })}
                >
                  {lm.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Leaflet Map Container with Advanced Enterprise GIS Overlays */}
      <div
        className="map-container"
        style={{
          height: isFullscreen ? '100vh' : height,
          borderRadius: isFullscreen ? '0px' : 'var(--radius-lg)',
          overflow: 'hidden',
          position: isFullscreen ? 'fixed' : 'relative',
          ...(isFullscreen ? {
            top: 0,
            left: 0,
            width: '100vw',
            zIndex: 99999,
            background: '#ffffff',
          } : {}),
        }}
      >
        {/* Floating Real-Time Turn-by-Turn Maneuver HUD (Swiggy / GMaps Style) */}
        {effectivePolyline && effectivePolyline.length > 1 && showTurnHud && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid #10b981',
            borderRadius: '12px',
            padding: '10px 14px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '360px',
            pointerEvents: 'auto',
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
            }}>
              <SvgArrowTurn direction={activeTurnStep.direction} size={20} color="#ffffff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activeTurnStep.distanceMeters ? `In ~${activeTurnStep.distanceMeters}m` : 'Next Maneuver'}
                </span>
                <span style={{ fontSize: '9px', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '1px 5px', borderRadius: '4px' }}>
                  Step {activeTurnStep.index + 1}/{activeTurnStep.totalSteps}
                </span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeTurnStep.name || 'Trichy Arterial Corridor'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {activeTurnStep.instruction}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowTurnHud(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '14px',
                padding: '2px',
                lineHeight: 1,
              }}
              title="Hide Turn-by-Turn HUD"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        )}

        {/* Floating Enterprise Compass Rose Dial HUD */}
        {vehicleState && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: isFullscreen ? '70px' : '16px',
              zIndex: 1000,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid #cbd5e1',
              borderRadius: '50%',
              width: '52px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
            title={`Courier Heading: ${Math.round(vehicleState.bearing)}° (${getCardinalDirection(vehicleState.bearing)}). Click to center.`}
            onClick={() => setFollowRider(true)}
          >
            <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ position: 'absolute', top: '-1px', fontSize: '8px', fontWeight: 900, color: '#ef4444' }}>N</span>
              <span style={{ position: 'absolute', bottom: '-1px', fontSize: '8px', fontWeight: 800, color: '#94a3b8' }}>S</span>
              <span style={{ position: 'absolute', left: '-1px', fontSize: '8px', fontWeight: 800, color: '#94a3b8' }}>W</span>
              <span style={{ position: 'absolute', right: '-1px', fontSize: '8px', fontWeight: 800, color: '#94a3b8' }}>E</span>
              <div style={{
                width: '2px',
                height: '28px',
                transform: `rotate(${vehicleState.bearing}deg)`,
                transformOrigin: '50% 50%',
                transition: 'transform 0.25s linear',
                position: 'relative',
              }}>
                <div style={{ position: 'absolute', top: 0, left: '-3px', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '12px solid #ef4444' }}></div>
                <div style={{ position: 'absolute', bottom: 0, left: '-3px', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '12px solid #64748b' }}></div>
              </div>
              <div style={{ position: 'absolute', width: '5px', height: '5px', borderRadius: '50%', background: '#0f172a' }}></div>
            </div>
          </div>
        )}

        {/* Exit Fullscreen Floating Button */}
        {isFullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              zIndex: 1000,
              background: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 14px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              pointerEvents: 'auto',
            }}
          >
            <SvgExitFullscreen size={14} color="#ffffff" />
            <span>Exit Fullscreen</span>
          </button>
        )}

        <MapContainer center={defaultCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
          <MapInvalidator />
          {mapTheme === 'esri' ? (
            <TileLayer
              key="tile-esri"
              attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          ) : mapTheme === 'hot' ? (
            <TileLayer
              key="tile-osm-hot"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
              subdomains={['a', 'b', 'c']}
              maxZoom={19}
            />
          ) : (
            <TileLayer
              key="tile-osm-std"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          <MapBoundsUpdater
            markers={filteredMarkers}
            routePolyline={effectivePolyline}
            center={defaultCenter}
            isFollowing={Boolean(vehicleState && followRider && zoomMode === 'street')}
          />
          <MapFlyToController targetLocation={flyTarget} />
          <RiderFollowController
            vehicleState={vehicleState}
            isFollowing={followRider}
            zoomMode={zoomMode}
            routePolyline={effectivePolyline}
          />

          {/* Cold-Chain HACCP Safety Perimeter Buffer Rings (450m radius) */}
          {showHaccpPerimeter && routeWaypoints && routeWaypoints.map((wp, wIdx) => (
            <Circle
              key={`haccp-circle-${wp.lat}-${wp.lng}-${wIdx}`}
              center={[wp.lat, wp.lng]}
              radius={450}
              pathOptions={{
                color: wIdx === 0 ? '#8b5cf6' : wIdx === 1 ? '#059669' : '#0284c7',
                fillColor: wIdx === 0 ? '#8b5cf6' : wIdx === 1 ? '#059669' : '#0284c7',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '5, 5',
              }}
            />
          ))}

          {/* AI Optimal Route Polyline: Rock-Solid Static Corridor (Zero SVG Flickering) */}
          {effectivePolyline && effectivePolyline.length > 1 && (
            <>
              {/* Outer Glow Halo */}
              <Polyline
                positions={effectivePolyline}
                pathOptions={{
                  color: routeColor || '#059669',
                  weight: 8,
                  opacity: 0.28,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Solid Green Roadway Line */}
              <Polyline
                positions={effectivePolyline}
                pathOptions={{
                  color: routeColor || '#059669',
                  weight: 5,
                  opacity: 0.92,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              {/* Directional Navigation Dash Track */}
              <Polyline
                positions={effectivePolyline}
                pathOptions={{
                  color: '#ffffff',
                  weight: 2,
                  opacity: 0.8,
                  dashArray: '6, 12',
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </>
          )}

          {/* Dynamic Traffic Congestion Segments Overlay */}
          {showTraffic && trafficSegments.map((seg, sIdx) => (
            <Polyline
              key={`traffic-flow-${sIdx}`}
              positions={seg.positions}
              pathOptions={{
                color: seg.color,
                weight: 6,
                opacity: 0.88,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          ))}

          {/* Real-Time Animated Courier Vehicle Marker with Heading Rotation */}
          {vehicleState && (
            <Marker
              position={[vehicleState.lat, vehicleState.lng]}
              icon={createTwoWheelerIcon(vehicleState.bearing, liveSpeedKmh)}
              zIndexOffset={1000}
            >
              <Popup>
                <div style={{ padding: '6px', minWidth: '220px', fontFamily: 'system-ui, sans-serif' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f0fdf4', border: '1.5px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <SvgScooter size={18} color="#059669" />
                      </div>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', lineHeight: 1.2 }}>M. Karthik</strong>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#059669', fontWeight: 700 }}>
                          <SvgStar size={10} color="#f59e0b" />
                          <span>4.9 • Two-Wheeler Partner</span>
                        </span>
                      </div>
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: 800, background: '#ecfdf5', color: '#059669', padding: '2px 6px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                      LIVE
                    </span>
                  </div>

                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ fontSize: '11px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Vehicle:</span>
                      <strong style={{ color: '#0f172a' }}>TVS iQube EV (TN-45-BM-8821)</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Live Speed:</span>
                      <strong style={{ color: '#059669' }}>{liveSpeedKmh} km/h • {Math.round(vehicleState.bearing)}° {getCardinalDirection(vehicleState.bearing)}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Distance to Drop:</span>
                      <strong style={{ color: '#0284c7' }}>{vehicleState.remainingDistanceKm.toFixed(1)} km (~{liveEtaMins} mins)</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Thermal Hot-Box:</span>
                      <strong style={{ color: '#059669' }}>{liveHaccpTemp}°C (Safe Range)</strong>
                    </div>
                  </div>

                  {fullRouteGmapsUrl && (
                    <a
                      href={fullRouteGmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                        marginTop: '10px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: '#1a73e8',
                        color: '#ffffff',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        boxShadow: '0 2px 4px rgba(26, 115, 232, 0.25)',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                      </svg>
                      Open Live Route in Google Maps
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* AI Route Navigational Waypoints */}
          {routeWaypoints && routeWaypoints.map((wp, idx) => {
            const wpGmapsUrl = getGoogleMapsNavigationUrl(wp.lat, wp.lng, wp.title);
            return (
              <Marker
                key={`wp-${wp.stepNumber || idx + 1}-${wp.lat}-${wp.lng}-${idx}`}
                position={[wp.lat, wp.lng]}
                icon={icons[`waypoint${wp.stepNumber || idx + 1}`] || icons.default}
              >
                <Popup>
                  <div style={{ padding: '4px', minWidth: '190px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 800, color: routeColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Stop #{wp.stepNumber || idx + 1} • {wp.roleTag || 'Waypoint'}
                    </div>
                    <strong style={{ fontSize: '13px', color: '#0f172a', display: 'block', margin: '2px 0' }}>
                      {wp.title}
                    </strong>
                    {wp.subtitle && (
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {wp.subtitle}
                      </div>
                    )}
                    {wp.eta && (
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>
                        Est. Arrival: {wp.eta}
                      </div>
                    )}

                    {/* Direct Turn-by-Turn Navigation to this Stop */}
                    <a
                      href={wpGmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                        marginTop: '8px',
                        padding: '6px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: '#1a73e8',
                        color: '#ffffff',
                        borderRadius: '6px',
                        textDecoration: 'none',
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                      </svg>
                      Navigate to Stop in Google Maps
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {interactivePicker && onLocationSelect && (
            <LocationPickerHandler onLocationSelect={onLocationSelect} />
          )}

          {/* Selected Location Marker for Forms */}
          {selectedLocation && selectedLocation.lat && selectedLocation.lng && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={icons.selected}>
              <Popup>
                <div style={{ padding: '4px', minWidth: '180px' }}>
                  <strong style={{ color: '#dc2626', fontSize: '13px' }}>Selected Target Pinpoint</strong><br/>
                  <span style={{ fontSize: '11px', color: '#475569' }}>
                    Lat: {selectedLocation.lat}, Lng: {selectedLocation.lng}
                  </span>
                  {selectedLocation.address && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>{selectedLocation.address}</p>
                  )}
                  <a
                    href={getGoogleMapsNavigationUrl(selectedLocation.lat, selectedLocation.lng, selectedLocation.address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      width: '100%',
                      marginTop: '6px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 700,
                      background: '#1a73e8',
                      color: '#ffffff',
                      borderRadius: '4px',
                      textDecoration: 'none',
                    }}
                  >
                    View in Google Maps App
                  </a>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Realtime Filtered Markers */}
          {filteredMarkers.map((m, i) => {
            const gmapsNavUrl = getGoogleMapsNavigationUrl(m.lat, m.lng, m.title);
            const gmapsSearchUrl = getGoogleMapsSearchUrl(m.lat, m.lng);
            const badgeClass = m.type === 'donation' ? 'badge-primary'
              : m.type === 'donor' ? 'badge-secondary'
              : m.type === 'ngo' ? 'badge-accent'
              : 'badge-primary';
            const uniqueMarkerKey = m.uniqueKey
              ? `${m.uniqueKey}-${i}`
              : `marker-${m.type || 'pin'}-${m.id ?? 'node'}-${i}-${m.lat}-${m.lng}`;

            return (
              <Marker key={uniqueMarkerKey} position={[m.lat, m.lng]} icon={icons[m.type] || icons.default}>
                <Popup>
                  <div style={{ padding: '4px', minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{m.title}</strong>
                      <span className={`badge ${badgeClass}`} style={{ fontSize: '9px', textTransform: 'uppercase' }}>
                        {m.type}
                      </span>
                    </div>

                    {m.subtitle && (
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginTop: '2px' }}>
                        {m.subtitle}
                      </div>
                    )}
                    {m.address && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: 1.3 }}>
                        {m.address}
                      </div>
                    )}
                    {m.phone && (
                      <div style={{ fontSize: '11px', color: '#0d9668', fontWeight: 600, marginTop: '3px' }}>
                        Phone: {m.phone}
                      </div>
                    )}

                    {/* Coordinates & Google Maps Search Link */}
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                      GPS: {Number(m.lat).toFixed(4)}, {Number(m.lng).toFixed(4)} •{' '}
                      <a href={gmapsSearchUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#1a73e8', textDecoration: 'underline' }}>
                        View on GMaps
                      </a>
                    </div>

                    {/* Primary Action: Direct Turn-by-Turn Navigation in Google Maps App */}
                    <a
                      href={gmapsNavUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        width: '100%',
                        marginTop: '8px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: 700,
                        background: '#1a73e8',
                        color: '#ffffff',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        boxShadow: '0 1px 3px rgba(26, 115, 232, 0.3)',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                      </svg>
                      Navigate in Google Maps (App)
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {interactivePicker && (
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          * Click anywhere on the Trichy map or use the GPS button to set exact latitude & longitude coordinates.
        </span>
      )}
    </div>
  );
}
