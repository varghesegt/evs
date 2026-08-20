import { useState } from 'react';
import { solveCvrpRoute } from '../api/aiApi';

export default function CvrpLogisticsModal({ isOpen, onClose }) {
  const [capacityKg, setCapacityKg] = useState('100');
  const [solving, setSolving] = useState(false);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const handleSolve = async () => {
    setSolving(true);
    setResult(null);

    try {
      const payload = {
        volunteerStartLat: 10.7970,
        volunteerStartLng: 78.6910,
        vehicleCapacityKg: parseFloat(capacityKg) || 100.0,
      };

      const res = await solveCvrpRoute(payload);
      setResult(res.data);
    } catch (err) {
      console.error('CVRP Error', err);
    } finally {
      setSolving(false);
    }
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
      <div className="card" style={{
        maxWidth: '700px',
        width: '100%',
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        boxShadow: 'var(--shadow-xl)',
        maxHeight: '90vh',
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
          ✕
        </button>

        <div style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid #e2e8f0', paddingBottom: 'var(--space-3)' }}>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Operations Research • Capacitated Routing
          </div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 800, color: 'var(--color-text)', margin: '2px 0 0 0' }}>
            Multi-Stop CVRP Logistics Route Optimizer
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '2px 0 0 0' }}>
            Consolidates multiple pickups and dropoffs into a single fuel-efficient trip under vehicle payload constraints.
          </p>
        </div>

        {/* Input Controls */}
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
            onClick={handleSolve}
            disabled={solving}
          >
            {solving ? 'Solving Routing Problem...' : 'Calculate CVRP Multi-Stop Route'}
          </button>
        </div>

        {/* CVRP Output Results */}
        {result && (
          <div style={{ animation: 'fadeIn 0.25s ease' }}>
            {/* Impact Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
            }}>
              <div style={{ background: '#f0fdf4', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46' }}>{result.totalDistanceKm} km</div>
                <span style={{ fontSize: '10px', color: '#047857' }}>Optimized Distance</span>
              </div>
              <div style={{ background: '#eff6ff', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #bfdbfe' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af' }}>{result.distanceSavedKm} km</div>
                <span style={{ fontSize: '10px', color: '#2563eb' }}>Distance Conserved</span>
              </div>
              <div style={{ background: '#fffbeb', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#92400e' }}>{result.fuelSavedLiters} L</div>
                <span style={{ fontSize: '10px', color: '#b45309' }}>Fuel Saved</span>
              </div>
              <div style={{ background: '#fef2f2', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid #fecaca' }}>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#991b1b' }}>{result.co2eSavedTransportKg} kg</div>
                <span style={{ fontSize: '10px', color: '#dc2626' }}>Transport CO₂e Saved</span>
              </div>
            </div>

            {/* Route Sequence Table */}
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
              Ordered Multi-Stop Visit Sequence
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
                  </tr>
                </thead>
                <tbody>
                  {result.optimizedRoute.map(stop => (
                    <tr key={stop.stopOrder}>
                      <td style={{ fontWeight: 800, textAlign: 'center' }}>{stop.stopOrder}</td>
                      <td>
                        <div style={{ fontWeight: 700 }}>{stop.name}</div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>{stop.address}</div>
                      </td>
                      <td>
                        <span className={`badge ${stop.nodeType === 'START' ? 'badge-neutral' : stop.nodeType === 'PICKUP' ? 'badge-primary' : 'badge-accent'}`}>
                          {stop.nodeType}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{stop.loadKg} kg</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{stop.cumulativeDistanceKm} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3)',
              background: result.capacityConstraintSatisfied ? '#f0fdf4' : '#fef2f2',
              borderRadius: 'var(--radius-md)',
              fontSize: '11px',
              color: result.capacityConstraintSatisfied ? '#065f46' : '#991b1b',
              fontWeight: 600,
            }}>
              {result.capacityConstraintSatisfied
                ? `Vehicle capacity constraint satisfied (${result.totalLoadCarriedKg} kg carried vs ${capacityKg} kg max capacity).`
                : `Capacity constraint warning: Total load ${result.totalLoadCarriedKg} kg exceeds ${capacityKg} kg capacity.`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
