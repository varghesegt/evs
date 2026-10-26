import { useState, useEffect } from 'react';
import { logHaccpTelemetry, getHaccpTelemetry } from '../api/haccpApi';

export default function HaccpMonitorModal({ donationId = 1, isOpen, onClose }) {
  const [telemetryData, setTelemetryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState('');

  const fetchTelemetry = async () => {
    if (!donationId) return;
    setLoading(true);
    try {
      const res = await getHaccpTelemetry(donationId);
      setTelemetryData(res.data);
    } catch (err) {
      console.warn('No prior telemetry found, initializing fresh telemetry stream.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTelemetry();
    }
  }, [isOpen, donationId]);

  if (!isOpen) return null;

  const handleSimulate = async (temp, ambient, humidity, doorOpen, minutes) => {
    setSimulating(true);
    setError('');
    try {
      const payload = {
        donationId,
        deviceId: 'BLE-BEACON-VAN-TRZ-01',
        temperatureCelsius: temp,
        ambientTempCelsius: ambient,
        humidityPercent: humidity,
        isDoorOpen: doorOpen,
        inTransitMinutes: minutes,
        latitude: 10.7905,
        longitude: 78.6980,
      };
      const res = await logHaccpTelemetry(payload);
      setTelemetryData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to transmit IoT telemetry beacon.');
    } finally {
      setSimulating(false);
    }
  };

  const currentTemp = telemetryData ? telemetryData.currentTemperature : 4.0;
  const isDanger = telemetryData ? telemetryData.isDangerZone : false;
  const isTripped = telemetryData ? telemetryData.safetyTripTriggered : false;

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
        maxWidth: '750px',
        width: '100%',
        background: '#ffffff',
        border: isTripped ? '3px solid #dc2626' : isDanger ? '3px solid #f59e0b' : '3px solid #10b981',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(14px, 2.5vw, 24px)',
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
          &times;
        </button>

        {/* Header */}
        <div style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid #e2e8f0', paddingBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Cold-Chain IoT & Food Safety Subsystem
            </span>
            <span className={`badge ${isTripped ? 'badge-danger' : isDanger ? 'badge-warning' : 'badge-primary'}`}>
              {isTripped ? 'BIO-DIVERTED TO COMPOST' : isDanger ? 'HACCP DANGER ZONE' : 'SAFETY COMPLIANT'}
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
            HACCP In-Transit Cold-Chain Telemetry Monitor
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Donation #{donationId} • Bluetooth Low Energy (BLE) In-Transit Probe Logging & Automated Spoilage Safeguard
          </p>
        </div>

        {/* Danger Alert / Spoilage Reroute Banner */}
        {isTripped && (
          <div style={{
            background: '#fef2f2',
            border: '2px solid #ef4444',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
            marginBottom: 'var(--space-4)',
            animation: 'pulse 2s infinite',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b91c1c', fontWeight: 800, fontSize: '14px' }}>
              AUTOMATIC BIOHAZARD SAFETY TRIP TRIGGERED
            </div>
            <p style={{ fontSize: '12px', color: '#991b1b', margin: '6px 0 10px 0', lineHeight: 1.5 }}>
              Critical thermal breach detected! Temperature remained in the microbiological danger zone (5°C - 55°C) beyond allowable limits. To eliminate foodborne illness risk, distribution is aborted and this cargo has been redirected to municipal bio-digestion.
            </p>
            <div style={{
              background: '#ffffff',
              padding: '10px 14px',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              fontSize: '12px',
            }}>
              <strong style={{ color: '#b91c1c' }}>Reroute Facility:</strong> {telemetryData?.rerouteFacilityName}<br />
              <strong style={{ color: '#b91c1c' }}>Address:</strong> {telemetryData?.rerouteAddress}<br />
              <strong style={{ color: '#b91c1c' }}>GPS Target:</strong> {telemetryData?.rerouteLat}, {telemetryData?.rerouteLng}
            </div>
          </div>
        )}

        {/* Current Sensor Readings Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-5)',
        }}>
          <div style={{
            background: isDanger ? '#fffbeb' : '#f0fdf4',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            border: isDanger ? '1px solid #fde68a' : '1px solid #bbf7d0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: isDanger ? '#b45309' : '#047857', fontWeight: 700, textTransform: 'uppercase' }}>
              Probe Temp
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: isDanger ? '#b45309' : '#065f46' }}>
              {currentTemp != null ? `${currentTemp}°C` : '--'}
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>HACCP Limit: &le;4°C or &ge;55°C</span>
          </div>

          <div style={{
            background: '#f8fafc',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Ambient Temp
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#334155' }}>
              {telemetryData?.ambientTempCelsius ? `${telemetryData.ambientTempCelsius}°C` : '32°C'}
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Exterior Climate</span>
          </div>

          <div style={{
            background: '#f8fafc',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Relative Humidity
            </div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#0284c7' }}>
              {telemetryData?.currentHumidity ? `${telemetryData.currentHumidity}%` : '60%'}
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>Cargo Compartment</span>
          </div>

          <div style={{
            background: '#f8fafc',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #e2e8f0',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
              Sensor Probe Status
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
              ONLINE (BLE)
            </div>
            <span style={{ fontSize: '10px', color: '#10b981' }}>Signal 98%</span>
          </div>
        </div>

        {/* HACCP Thermal Range Visualizer */}
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
            HACCP Biological Safety Spectrum:
          </div>
          <div style={{
            display: 'flex',
            height: '24px',
            borderRadius: '8px',
            overflow: 'hidden',
            fontSize: '10px',
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: '24px',
            color: '#ffffff',
          }}>
            <div style={{ flex: '1 1 15%', background: '#0284c7' }}>&le;4°C Chilled Safe</div>
            <div style={{ flex: '1 1 70%', background: '#f59e0b' }}>5°C - 55°C Danger Zone (Bacterial Proliferation)</div>
            <div style={{ flex: '1 1 15%', background: '#dc2626' }}>&ge;55°C Hot Safe</div>
          </div>
        </div>

        {/* Live Hardware Simulator Controls */}
        <div style={{
          background: '#f1f5f9',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 'var(--space-4)',
        }}>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: '8px' }}>
            Hardware IoT Probe Telemetry Simulator
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={simulating}
              onClick={() => handleSimulate(3.8, 33.0, 55.0, false, 15)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #10b981',
                background: '#ffffff',
                color: '#065f46',
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Transmit Cold In-Transit (3.8°C Safe)
            </button>

            <button
              type="button"
              disabled={simulating}
              onClick={() => handleSimulate(63.0, 34.0, 50.0, false, 20)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #0284c7',
                background: '#ffffff',
                color: '#0369a1',
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Transmit Hot In-Transit (63°C Safe)
            </button>

            <button
              type="button"
              disabled={simulating}
              onClick={() => handleSimulate(28.0, 38.0, 70.0, true, 45)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #f59e0b',
                background: '#fffbeb',
                color: '#b45309',
                fontWeight: 600,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Transmit Danger Zone (28°C Warning)
            </button>

            <button
              type="button"
              disabled={simulating}
              onClick={() => handleSimulate(38.5, 46.0, 85.0, true, 120)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #ef4444',
                background: '#fef2f2',
                color: '#b91c1c',
                fontWeight: 700,
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              Trigger Spoilage Trip & Compost Reroute
            </button>
          </div>
        </div>

        {error && <div style={{ color: '#b91c1c', fontSize: '12px', marginBottom: '8px' }}>{error}</div>}

        {/* Telemetry History Stream */}
        {telemetryData?.history && telemetryData.history.length > 0 && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Chronological BLE Telemetry Log ({telemetryData.history.length} Packets)
            </div>
            <div className="table-container" style={{ maxHeight: '160px', overflowY: 'auto' }}>
              <table className="table" style={{ fontSize: '11px' }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Sensor Temp</th>
                    <th>Humidity</th>
                    <th>Safety Evaluation</th>
                  </tr>
                </thead>
                <tbody>
                  {telemetryData.history.slice().reverse().map((h, i) => (
                    <tr key={i}>
                      <td>{h.timestamp}</td>
                      <td style={{ fontWeight: 700, color: h.dangerZone ? '#b45309' : '#047857' }}>
                        {h.temp}°C
                      </td>
                      <td>{h.humidity}%</td>
                      <td>
                        <span className={`badge ${h.dangerZone ? 'badge-warning' : 'badge-primary'}`}>
                          {h.dangerZone ? 'Danger Zone' : 'Safe HACCP'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
