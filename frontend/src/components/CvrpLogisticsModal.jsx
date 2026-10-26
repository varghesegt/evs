import { useState } from 'react';
import { solveCvrpRoute, solveVrptwRoute } from '../api/aiApi';
import { getGoogleMapsNavigationUrl, getGoogleMapsMultiStopRouteUrl, openWhatsAppDispatch } from '../utils/gmapsUtils';

export default function CvrpLogisticsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('vrptw'); // 'cvrp' | 'vrptw'
  const [capacityKg, setCapacityKg] = useState('100');
  const [solving, setSolving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [cvrpResult, setCvrpResult] = useState(null);
  const [vrptwResult, setVrptwResult] = useState(null);

  if (!isOpen) return null;

  const handleSolveCvrp = async () => {
    setSolving(true);
    setErrorMsg('');
    setCvrpResult(null);

    try {
      const payload = {
        volunteerStartLat: 10.7970,
        volunteerStartLng: 78.6910,
        vehicleCapacityKg: parseFloat(capacityKg) || 100.0,
      };

      const res = await solveCvrpRoute(payload);
      setCvrpResult(res.data);
    } catch (err) {
      console.error('CVRP Error', err);
      setErrorMsg(err.response?.data?.message || 'Failed to compute CVRP route.');
    } finally {
      setSolving(false);
    }
  };

  const handleSolveVrptw = async () => {
    setSolving(true);
    setErrorMsg('');
    setVrptwResult(null);

    try {
      const payload = {
        trafficCondition: 'MODERATE',
        fleet: [
          {
            vehicleId: 'VAN-TRZ-01',
            vehicleType: 'REFRIGERATED_VAN',
            capacityKg: 250.0,
            startLat: 10.7970,
            startLng: 78.6910,
            startAddress: 'Central Distribution Hub, TVS Tollgate, Trichy',
            maxShiftHours: 4.0,
          },
          {
            vehicleId: 'EV-AUTO-02',
            vehicleType: 'ELECTRIC_CARGO',
            capacityKg: 100.0,
            startLat: 10.8055,
            startLng: 78.6850,
            startAddress: 'Cantonment Logistics Depot, Trichy',
            maxShiftHours: 3.0,
          },
        ],
        pickupNodes: [
          {
            id: 101,
            name: 'SRM Hotel & Convention Centre',
            nodeType: 'PICKUP',
            lat: 10.7985,
            lng: 78.6890,
            quantityKg: 45.0,
            address: 'Race Course Rd, TVS Tollgate',
            earliestTime: '11:30',
            latestTime: '12:15',
            serviceDurationMinutes: 10.0,
            perishabilityDeadlineHours: 4.0,
          },
          {
            id: 102,
            name: 'Hotel Sangam Banquet',
            nodeType: 'PICKUP',
            lat: 10.8055,
            lng: 78.6850,
            quantityKg: 30.0,
            address: 'Collector Office Rd, Cantonment',
            earliestTime: '11:45',
            latestTime: '12:30',
            serviceDurationMinutes: 10.0,
            perishabilityDeadlineHours: 3.5,
          },
          {
            id: 103,
            name: 'Diwan Banquets Central',
            nodeType: 'PICKUP',
            lat: 10.8120,
            lng: 78.6890,
            quantityKg: 25.0,
            address: 'Main Guard Gate, Thillai Nagar',
            earliestTime: '12:00',
            latestTime: '12:45',
            serviceDurationMinutes: 10.0,
            perishabilityDeadlineHours: 3.0,
          },
        ],
        deliveryNodes: [
          {
            id: 201,
            name: 'Akshaya Patra Food Shelter',
            nodeType: 'DELIVERY',
            lat: 10.8290,
            lng: 78.6930,
            quantityKg: 60.0,
            address: 'Chathiram Bus Stand, Trichy',
            earliestTime: '12:30',
            latestTime: '13:15',
            serviceDurationMinutes: 15.0,
          },
          {
            id: 202,
            name: 'Anbalayam Children Home',
            nodeType: 'DELIVERY',
            lat: 10.8150,
            lng: 78.7020,
            quantityKg: 40.0,
            address: 'Teppakulam, Trichy',
            earliestTime: '12:45',
            latestTime: '13:30',
            serviceDurationMinutes: 15.0,
          },
        ],
      };

      const res = await solveVrptwRoute(payload);
      setVrptwResult(res.data);
    } catch (err) {
      console.error('VRPTW Error', err);
      setErrorMsg(err.response?.data?.message || 'Failed to compute VRPTW schedule.');
    } finally {
      setSolving(false);
    }
  };

  const handleDispatchRouteWhatsApp = (route, routeGmapsUrl) => {
    let text = `*ECOSHARE AI - FLEET TOUR DISPATCH*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Vehicle:* ${route.vehicleId || 'Vehicle'} (${(route.vehicleType || 'Fleet').replace(/_/g, ' ')})\n`;
    text += `*Peak Payload:* ${route.peakLoadKg ?? 0} / ${route.vehicleCapacityKg ?? 0} kg\n`;
    text += `*Tour Distance:* ${route.tourDistanceKm ?? 0} km\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*STOPS & TIME WINDOWS:*\n`;
    const schedule = route.schedule || route.stops || [];
    schedule.forEach(s => {
      text += `• Stop #${s.sequenceOrder || 1} [${s.stopType || 'STOP'}]: ${s.name || ''} (${s.address || ''}) | Window: ${s.timeWindow || '-'} | ETA: ${s.estimatedArrivalTime || '-'}\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Google Maps Turn-by-Turn Navigation:*\n${routeGmapsUrl}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Tap link to start turn-by-turn navigation in Google Maps App.*`;

    openWhatsAppDispatch('', text);
  };

  const handleDispatchCvrpWhatsApp = (stops, routeGmapsUrl) => {
    let text = `*ECOSHARE AI - SINGLE VOLUNTEER CVRP TOUR*\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Vehicle Capacity:* ${capacityKg} kg\n`;
    text += `*Optimized Tour Stops:* ${stops.length} stops\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*STOPS & PICKUPS:*\n`;
    stops.forEach(s => {
      text += `• Stop #${s.stopOrder || 1} [${s.nodeType || 'NODE'}]: ${s.name || ''} (${s.address || ''}) | Load: ${s.loadKg || 0} kg\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Google Maps Turn-by-Turn Navigation:*\n${routeGmapsUrl}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `*Tap link to start turn-by-turn navigation in Google Maps App.*`;

    openWhatsAppDispatch('', text);
  };

  return (
    <div className="sidebar-overlay" style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: 'var(--space-4)',
    }}>
      <div className="card modal-card" style={{
        maxWidth: '820px',
        width: '100%',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(14px, 2.5vw, 24px)',
        boxShadow: 'var(--shadow-xl)',
        maxHeight: '92vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#f1f5f9',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            cursor: 'pointer',
            fontWeight: '800',
            color: '#64748b',
          }}
        >
          &times;
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid #e2e8f0', paddingBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Operations Research • Algorithmic Fleet Optimization
            </span>
            <span className="badge badge-primary">Heterogeneous VRPTW</span>
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--color-text)', margin: '4px 0 2px 0' }}>
            Multi-Vehicle VRPTW & Capacitated Logistics Engine
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0 }}>
            Simultaneous multi-vehicle routing with strict pickup & delivery time windows, payload capacities, and cold-chain constraints.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            marginBottom: '14px',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-4)' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('vrptw'); setErrorMsg(''); }}
            className={`btn btn-sm ${activeTab === 'vrptw' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: 700 }}
          >
            Multi-Vehicle VRPTW Fleet Engine
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('cvrp'); setErrorMsg(''); }}
            className={`btn btn-sm ${activeTab === 'cvrp' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: 700 }}
          >
            Single Volunteer CVRP Routing
          </button>
        </div>

        {activeTab === 'vrptw' ? (
          <div>
            {/* VRPTW Controls */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-4)',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', marginBottom: '6px' }}>
                Active Municipal Fleet Configuration (Trichy Metro Hub):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7' }}>Van 1: Tata Ace EV (Reefer Cold Van)</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Capacity: 250 kg • Cold-Chain Active (&le;4°C)</div>
                </div>
                <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#059669' }}>Auto 2: Mahindra Treo Zor EV (Cargo)</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Capacity: 100 kg • Dry & Ambient Food Crates</div>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{ width: '100%', minHeight: '44px', fontWeight: 800, fontSize: '13px' }}
                onClick={handleSolveVrptw}
                disabled={solving}
              >
                {solving ? 'Solving Vehicle Routing Problem with Time Windows...' : 'Optimize Multi-Vehicle VRPTW Fleet Schedule'}
              </button>
            </div>

            {/* VRPTW Results Output */}
            {vrptwResult && (() => {
              const fleetRoutes = vrptwResult.vehicleTours || vrptwResult.fleetRoutes || [];

              return (
                <div style={{ animation: 'fadeIn 0.25s ease' }}>
                  {/* Fleet Impact Strip */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-4)',
                  }}>
                    <div style={{ background: '#f0fdf4', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46' }}>{vrptwResult.totalFleetDistanceKm ?? 0} km</div>
                      <span style={{ fontSize: '10px', color: '#047857' }}>Total Fleet Dist.</span>
                    </div>
                    <div style={{ background: '#eff6ff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af' }}>{vrptwResult.fleetDistanceSavedKm ?? 0} km</div>
                      <span style={{ fontSize: '10px', color: '#2563eb' }}>Distance Conserved</span>
                    </div>
                    <div style={{ background: '#fffbeb', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#92400e' }}>{vrptwResult.fuelSavedLiters ?? 0} L</div>
                      <span style={{ fontSize: '10px', color: '#b45309' }}>Fuel Saved</span>
                    </div>
                    <div style={{ background: '#fef2f2', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>{vrptwResult.transportCo2eAvoidedKg ?? 0} kg</div>
                      <span style={{ fontSize: '10px', color: '#dc2626' }}>Transport CO₂ Avoided</span>
                    </div>
                  </div>

                  {fleetRoutes.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                      No vehicle tours generated.
                    </div>
                  ) : (
                    fleetRoutes.map((route, rIdx) => {
                      const schedule = route.schedule || route.stops || [];
                      const origin = schedule[0];
                      const dest = schedule[schedule.length - 1];
                      const intermediates = schedule.length > 2 ? schedule.slice(1, -1) : [];
                      const routeGmapsUrl = getGoogleMapsMultiStopRouteUrl(origin, dest, intermediates);

                      return (
                        <div key={rIdx} style={{
                          marginBottom: 'var(--space-4)',
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 'var(--radius-lg)',
                          overflow: 'hidden',
                        }}>
                          <div style={{
                            background: '#f8fafc',
                            padding: '10px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '8px',
                            borderBottom: '1px solid #e2e8f0',
                          }}>
                            <div>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{route.vehicleId || `Vehicle #${rIdx + 1}`}</strong>
                              <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>({(route.vehicleType || 'Courier').replace(/_/g, ' ')})</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <div style={{ fontSize: '11px', color: '#047857', fontWeight: 700 }}>
                                Peak Load: {route.peakLoadKg ?? 0} / {route.vehicleCapacityKg ?? 0} kg • Tour: {route.tourDistanceKm ?? 0} km
                              </div>
                              <a
                                href={routeGmapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm"
                                style={{
                                  background: '#1a73e8',
                                  color: '#ffffff',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                }}
                                title="Open multi-stop route in Google Maps App"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                                </svg>
                                Open Route in GMaps
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDispatchRouteWhatsApp(route, routeGmapsUrl)}
                                className="btn btn-sm"
                                style={{
                                  background: '#25D366',
                                  color: '#ffffff',
                                  fontWeight: 800,
                                  fontSize: '11px',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  border: 'none',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 1px 3px rgba(37, 211, 102, 0.3)',
                                }}
                                title="Dispatch Complete Multi-Stop Route via WhatsApp"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.814 2.8.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm6.837 5.766c-.001 3.769-3.067 6.835-6.837 6.835-1.168 0-2.273-.3-3.238-.838l-3.593.942.959-3.504c-.604-1.026-.948-2.203-.948-3.435.001-3.769 3.068-6.836 6.838-6.836 3.769 0 6.839 3.067 6.839 6.836z"/>
                                </svg>
                                Dispatch WhatsApp
                              </button>
                            </div>
                          </div>

                          <div className="table-container" style={{ margin: 0 }}>
                            <table className="table" style={{ fontSize: '11px' }}>
                              <thead>
                                <tr>
                                  <th>Seq #</th>
                                  <th>Node / Stop</th>
                                  <th>Type</th>
                                  <th>Time Window</th>
                                  <th>ETA</th>
                                  <th>Payload Carried</th>
                                  <th>Cumul. Dist</th>
                                  <th>Navigation</th>
                                </tr>
                              </thead>
                              <tbody>
                                {schedule.map((stop, sIdx) => (
                                  <tr key={`vrptw-stop-${stop.sequenceOrder ?? sIdx}-${sIdx}`}>
                                    <td style={{ fontWeight: 800, textAlign: 'center' }}>{stop.sequenceOrder ?? (sIdx + 1)}</td>
                                    <td>
                                      <div style={{ fontWeight: 700 }}>{stop.name || 'Stop'}</div>
                                      <div style={{ fontSize: '10px', color: '#64748b' }}>{stop.address || ''}</div>
                                    </td>
                                    <td>
                                      <span className={`badge ${stop.stopType === 'START' ? 'badge-neutral' : stop.stopType === 'PICKUP' ? 'badge-primary' : 'badge-accent'}`}>
                                        {stop.stopType || 'STOP'}
                                      </span>
                                    </td>
                                    <td style={{ color: '#0284c7', fontWeight: 600 }}>{stop.timeWindow || '-'}</td>
                                    <td style={{ fontWeight: 700, color: stop.windowSatisfied ? '#059669' : '#dc2626' }}>
                                      {stop.estimatedArrivalTime || '-'} {stop.windowSatisfied ? '(On Time)' : '(Delayed)'}
                                    </td>
                                    <td style={{ fontWeight: 600 }}>{stop.loadCarriedKg ?? 0} kg</td>
                                    <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{stop.cumulativeDistanceKm ?? 0} km</td>
                                    <td>
                                      <a
                                        href={getGoogleMapsNavigationUrl(stop.lat || 10.7985, stop.lng || 78.6890, stop.name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{ color: '#1a73e8', fontWeight: 700, textDecoration: 'none' }}
                                        title="Open individual stop in Google Maps App"
                                      >
                                        Directions &rarr;
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })()}
          </div>
        ) : (
          <div>
            {/* Single CVRP Controls */}
            <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'flex-end', marginBottom: 'var(--space-4)' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label" style={{ fontSize: '12px' }}>Volunteer Vehicle Capacity (kg)</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ fontSize: '13px', minHeight: '44px' }}
                  value={capacityKg}
                  onChange={(e) => setCapacityKg(e.target.value)}
                  placeholder="e.g. 100"
                />
              </div>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, minHeight: '44px', fontWeight: 700 }}
                onClick={handleSolveCvrp}
                disabled={solving}
              >
                {solving ? 'Solving Routing Problem...' : 'Calculate CVRP Multi-Stop Route'}
              </button>
            </div>

            {/* CVRP Output Results */}
            {cvrpResult && (() => {
              const cvrpStops = cvrpResult.optimizedRoute || cvrpResult.stops || [];
              const cvrpOrigin = cvrpStops[0];
              const cvrpDest = cvrpStops[cvrpStops.length - 1];
              const cvrpIntermediates = cvrpStops.length > 2 ? cvrpStops.slice(1, -1) : [];
              const cvrpGmapsUrl = getGoogleMapsMultiStopRouteUrl(cvrpOrigin, cvrpDest, cvrpIntermediates);

              return (
                <div style={{ animation: 'fadeIn 0.25s ease' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: 'var(--space-2)',
                    marginBottom: 'var(--space-4)',
                  }}>
                    <div style={{ background: '#f0fdf4', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46' }}>{cvrpResult.totalDistanceKm ?? 0} km</div>
                      <span style={{ fontSize: '10px', color: '#047857' }}>Optimized Distance</span>
                    </div>
                    <div style={{ background: '#eff6ff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af' }}>{cvrpResult.distanceSavedKm ?? 0} km</div>
                      <span style={{ fontSize: '10px', color: '#2563eb' }}>Distance Conserved</span>
                    </div>
                    <div style={{ background: '#fffbeb', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #fde68a' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#92400e' }}>{cvrpResult.fuelSavedLiters ?? 0} L</div>
                      <span style={{ fontSize: '10px', color: '#b45309' }}>Fuel Saved</span>
                    </div>
                    <div style={{ background: '#fef2f2', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #fecaca' }}>
                      <div style={{ fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>{cvrpResult.co2eSavedTransportKg ?? 0} kg</div>
                      <span style={{ fontSize: '10px', color: '#dc2626' }}>Transport CO₂e Saved</span>
                    </div>
                  </div>

                  {/* Google Maps & WhatsApp Action Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '10px 14px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '12px',
                  }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                      Multi-Stop Volunteer Tour ({cvrpStops.length} Stops)
                    </span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <a
                        href={cvrpGmapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm"
                        style={{
                          background: '#1a73e8',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '11px',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 1px 3px rgba(26, 115, 232, 0.3)',
                        }}
                        title="Launch turn-by-turn navigation in Google Maps App"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                        </svg>
                        Open Complete Tour in Google Maps
                      </a>
                      <button
                        type="button"
                        onClick={() => handleDispatchCvrpWhatsApp(cvrpStops, cvrpGmapsUrl)}
                        className="btn btn-sm"
                        style={{
                          background: '#25D366',
                          color: '#ffffff',
                          fontWeight: 800,
                          fontSize: '11px',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 1px 3px rgba(37, 211, 102, 0.3)',
                        }}
                        title="Dispatch Multi-Stop Route via WhatsApp"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.814 2.8.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm6.837 5.766c-.001 3.769-3.067 6.835-6.837 6.835-1.168 0-2.273-.3-3.238-.838l-3.593.942.959-3.504c-.604-1.026-.948-2.203-.948-3.435.001-3.769 3.068-6.836 6.838-6.836 3.769 0 6.839 3.067 6.839 6.836z"/>
                        </svg>
                        Dispatch WhatsApp
                      </button>
                    </div>
                  </div>

                  <div className="table-container" style={{ margin: 0 }}>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Stop #</th>
                          <th>Location / Node</th>
                          <th>Node Type</th>
                          <th>Payload (kg)</th>
                          <th>Cumulative Dist.</th>
                          <th>Maps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cvrpStops.map((stop, sIdx) => (
                          <tr key={`cvrp-stop-${stop.stopOrder ?? sIdx}-${sIdx}`}>
                            <td style={{ fontWeight: 800, textAlign: 'center' }}>{stop.stopOrder ?? (sIdx + 1)}</td>
                            <td>
                              <div style={{ fontWeight: 700 }}>{stop.name || 'Stop'}</div>
                              <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{stop.address || ''}</div>
                            </td>
                            <td>
                              <span className={`badge ${stop.nodeType === 'START' ? 'badge-neutral' : stop.nodeType === 'PICKUP' ? 'badge-primary' : 'badge-accent'}`}>
                                {stop.nodeType || 'STOP'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 600 }}>{stop.loadKg ?? 0} kg</td>
                            <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{stop.cumulativeDistanceKm ?? 0} km</td>
                            <td>
                              <a
                                href={getGoogleMapsNavigationUrl(stop.lat || 10.7985, stop.lng || 78.6890, stop.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#1a73e8', fontWeight: 700, textDecoration: 'none' }}
                                title="Open this stop in Google Maps App"
                              >
                                Directions &rarr;
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
