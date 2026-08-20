import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Icons per pin type
function createCustomIcon(color, symbol) {
  return new L.DivIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
      ">
        <svg width="32" height="42" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 24 12 24s12-15 12-24c0-6.63-5.37-12-12-12z" fill="${color}"/>
          <circle cx="12" cy="12" r="6" fill="white"/>
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
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42],
  });
}

const icons = {
  donor: createCustomIcon('#0d9668', 'D'),
  ngo: createCustomIcon('#0284c7', 'N'),
  volunteer: createCustomIcon('#8b5cf6', 'V'),
  donation: createCustomIcon('#d97706', 'F'),
  selected: createCustomIcon('#dc2626', 'S'),
  default: createCustomIcon('#64748b', '•'),
};

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

// Auto-bounds utility component
function MapBoundsUpdater({ markers, center }) {
  const map = useMap();

  useEffect(() => {
    if (markers && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    } else if (center) {
      map.setView(center, 13);
    }
  }, [markers, center, map]);

  return null;
}

export default function MapView({
  markers = [],
  center,
  zoom = 12,
  height = '400px',
  interactivePicker = false,
  selectedLocation = null,
  onLocationSelect = null,
  showFilters = true,
}) {
  const defaultCenter = center || [10.7905, 78.7047]; // Trichy
  const [filterType, setFilterType] = useState('ALL');
  const [isLocating, setIsLocating] = useState(false);

  // Filter markers based on selected chip
  const filteredMarkers = markers.filter(m => {
    if (filterType === 'ALL') return true;
    if (filterType === 'DONATIONS') return m.type === 'donation';
    if (filterType === 'DONORS') return m.type === 'donor';
    if (filterType === 'NGOS') return m.type === 'ngo';
    if (filterType === 'VOLUNTEERS') return m.type === 'volunteer';
    return true;
  });

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

  return (
    <div className="map-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {/* Top Filter Chips & Live Actions Toolbar */}
      {showFilters && (
        <div className="map-toolbar" style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-2)',
          background: 'var(--color-surface)',
          padding: 'var(--space-2) var(--space-3)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          fontSize: 'var(--font-size-xs)',
        }}>
          <div className="map-filter-chips" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-1)' }}>
            {[
              { id: 'ALL', label: `All (${markers.length})` },
              { id: 'DONATIONS', label: 'Food Surplus' },
              { id: 'DONORS', label: 'Donors' },
              { id: 'NGOS', label: 'NGO Shelters' },
              { id: 'VOLUNTEERS', label: 'Volunteers' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`btn btn-sm ${filterType === chip.id ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '2px 10px', fontSize: '11px', minHeight: '28px' }}
                onClick={() => setFilterType(chip.id)}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {interactivePicker && (
            <button
              type="button"
              className="btn btn-sm btn-accent"
              style={{ padding: '2px 10px', fontSize: '11px', minHeight: '28px' }}
              onClick={handleGetCurrentLocation}
              disabled={isLocating}
            >
              {isLocating ? 'Locating...' : 'Use My GPS Location'}
            </button>
          )}
        </div>
      )}

      {/* Main Leaflet Map Container */}
      <div className="map-container" style={{ height, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <MapContainer center={defaultCenter} zoom={zoom} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsUpdater markers={filteredMarkers} center={defaultCenter} />

          {interactivePicker && onLocationSelect && (
            <LocationPickerHandler onLocationSelect={onLocationSelect} />
          )}

          {/* Selected Location Marker for Forms */}
          {selectedLocation && selectedLocation.lat && selectedLocation.lng && (
            <Marker position={[selectedLocation.lat, selectedLocation.lng]} icon={icons.selected}>
              <Popup>
                <div style={{ padding: '4px' }}>
                  <strong style={{ color: '#dc2626' }}>Selected Location</strong><br/>
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    Lat: {selectedLocation.lat}, Lng: {selectedLocation.lng}
                  </span>
                  {selectedLocation.address && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>{selectedLocation.address}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Realtime Filtered Markers */}
          {filteredMarkers.map((m, i) => (
            <Marker key={m.id || i} position={[m.lat, m.lng]} icon={icons[m.type] || icons.default}>
              <Popup>
                <div style={{ padding: '4px', minWidth: '160px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{m.title}</strong>
                    {m.status && (
                      <span className={`badge ${m.status === 'DELIVERED' ? 'badge-primary' : m.status === 'ACTIVE' ? 'badge-secondary' : 'badge-accent'}`} style={{ fontSize: '10px' }}>
                        {m.status}
                      </span>
                    )}
                  </div>
                  {m.subtitle && <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{m.subtitle}</div>}
                  {m.address && <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>Address: {m.address}</div>}
                  {m.phone && <div style={{ fontSize: '11px', color: '#0d9668', marginTop: '2px' }}>Phone: {m.phone}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {interactivePicker && (
        <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          * Click anywhere on the map or use the GPS button to set exact latitude & longitude coordinates.
        </span>
      )}
    </div>
  );
}
