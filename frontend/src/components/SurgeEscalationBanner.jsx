import { useState, useEffect, useCallback } from 'react';
import { getSurgeStatus, triggerSurgeBroadcast } from '../api/aiApi';
import { openWhatsAppDispatch, getGoogleMapsNavigationUrl } from '../utils/gmapsUtils';
import { SvgShield, SvgPhone, SvgMapPin } from './MapIcons';

// Web Audio API Emergency Alert Chime Synthesizer
function playSurgeAlertChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc1.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 0.4);
  } catch (err) {
    // Audio context may be restricted by browser autoplay policy before user gesture
  }
}

export default function SurgeEscalationBanner({ onSelectBatch = null }) {
  const [surgeData, setSurgeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [broadcastedIds, setBroadcastedIds] = useState(new Set());
  const [broadcasting, setBroadcasting] = useState(null);

  const fetchSurgeStatus = useCallback(async (isInitial = false) => {
    try {
      setLoading(true);
      const res = await getSurgeStatus();
      setSurgeData(res.data);
      if (res.data?.activeSurgeAlert && isInitial) {
        playSurgeAlertChime();
      }
    } catch (err) {
      if (typeof window !== 'undefined' && !window.location.hostname.endsWith('github.io')) {
        console.warn('Surge status polling notice:', err?.message || err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSurgeStatus(true);
    const interval = setInterval(() => {
      fetchSurgeStatus(false);
    }, 45000);
    return () => clearInterval(interval);
  }, [fetchSurgeStatus]);

  if (!surgeData || (!surgeData.activeSurgeAlert && surgeData.elevatedCount === 0)) {
    return null;
  }

  const isCodeRed = surgeData.activeSurgeAlert;
  const criticalBatches = surgeData.criticalBatches || [];

  const handleBroadcast = async (batch) => {
    setBroadcasting(batch.donationId);
    try {
      await triggerSurgeBroadcast(batch.donationId);
      setBroadcastedIds(prev => new Set(prev).add(batch.donationId));
      if (batch.whatsAppBroadcastUrl) {
        window.open(batch.whatsAppBroadcastUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      // Fallback: open WhatsApp directly
      if (batch.whatsAppBroadcastUrl) {
        window.open(batch.whatsAppBroadcastUrl, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setBroadcasting(null);
    }
  };

  return (
    <div style={{
      marginBottom: 'var(--space-5)',
      background: isCodeRed ? '#fef2f2' : '#fffbeb',
      border: `2px solid ${isCodeRed ? '#ef4444' : '#f59e0b'}`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: isCodeRed ? '0 4px 18px rgba(239, 68, 68, 0.2)' : '0 2px 8px rgba(245, 158, 11, 0.15)',
      animation: isCodeRed ? 'codeRedSiren 3s infinite' : 'none',
      transition: 'all 0.2s ease',
    }}>
      {/* Alert Header Strip */}
      <div style={{
        padding: '14px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        background: isCodeRed ? 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)' : 'linear-gradient(135deg, #b45309 0%, #d97706 100%)',
        color: '#ffffff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            lineHeight: 1,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
          }}>
            <SvgShield size={18} color="#ffffff" />
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                background: '#ffffff',
                color: isCodeRed ? '#b91c1c' : '#b45309',
                padding: '2px 8px',
                borderRadius: '4px',
              }}>
                {isCodeRed ? 'CODE RED SURGE' : 'ELEVATED SURGE ALERT'}
              </span>
              <span style={{ fontSize: '11px', opacity: 0.9, fontWeight: 600 }}>
                {surgeData.ambientTemperatureC}°C Trichy Ambient Kinetic Decay
              </span>
            </div>
            <h4 style={{ margin: '3px 0 0 0', fontSize: '15px', fontWeight: 800, color: '#ffffff' }}>
              {surgeData.alertHeadline}
            </h4>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => fetchSurgeStatus(false)}
            disabled={loading}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            {loading ? 'Refreshing...' : '↻ Recalculate'}
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: '#ffffff',
              color: isCodeRed ? '#b91c1c' : '#b45309',
              border: 'none',
              fontSize: '11px',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isExpanded ? 'Collapse Batches ▲' : `View ${criticalBatches.length} Critical Batches ▼`}
          </button>
        </div>
      </div>

      {/* Expanded Critical Batches List */}
      {isExpanded && (
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
            The following batches have exceeded the safety threshold and require immediate courier dispatch to prevent bacterial degradation:
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '12px',
          }}>
            {criticalBatches.map((batch, bIdx) => {
              const isBroadcasted = broadcastedIds.has(batch.donationId);
              const gmapsUrl = getGoogleMapsNavigationUrl(batch.pickupLat || 10.8030, batch.pickupLng || 78.6850, batch.foodName);

              return (
                <div
                  key={`surge-batch-${batch.donationId}-${bIdx}`}
                  style={{
                    background: '#ffffff',
                    border: '1px solid ' + (batch.isCodeRed ? '#fca5a5' : '#fde68a'),
                    borderRadius: '8px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: batch.isCodeRed ? '#fee2e2' : '#fef3c7',
                        color: batch.isCodeRed ? '#991b1b' : '#92400e',
                        textTransform: 'uppercase',
                      }}>
                        {batch.isCodeRed ? 'CRITICAL EXPIRY' : 'EXPIRING SOON'}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: batch.isCodeRed ? '#dc2626' : '#d97706' }}>
                        Priority: {batch.dynamicPriorityScore}/100
                      </span>
                    </div>

                    <h5 style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                      {batch.foodName} ({batch.quantityKg} kg)
                    </h5>
                    <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>{batch.donorOrganization}</span>
                      <span>•</span>
                      <SvgPhone size={11} color="#059669" />
                      <span style={{ color: '#059669', fontWeight: 600 }}>{batch.donorPhone}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <SvgMapPin size={11} color="#0284c7" />
                      <span>{batch.pickupAddress || 'Trichy Food Zone'}</span>
                    </div>

                    <div style={{
                      marginTop: '8px',
                      padding: '6px 10px',
                      background: batch.isCodeRed ? '#fef2f2' : '#fefce8',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: batch.isCodeRed ? '#991b1b' : '#854d0e',
                    }}>
                      Safe Window Remaining: <strong>{batch.freshnessHoursRemaining} Hours</strong>
                    </div>

                    {/* Nearest Candidate Couriers */}
                    {batch.candidateCouriers && batch.candidateCouriers.length > 0 && (
                      <div style={{ marginTop: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          Auto-Matched Couriers Nearby:
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                          {batch.candidateCouriers.map((c, cIdx) => (
                            <div
                              key={`courier-cand-${c.volunteerId}-${cIdx}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '11px',
                                background: '#f8fafc',
                                padding: '4px 8px',
                                borderRadius: '4px',
                              }}
                            >
                              <span style={{ fontWeight: 600, color: '#1e293b' }}>
                                {c.name} ({c.vehicleType})
                              </span>
                              <span style={{ color: '#059669', fontWeight: 700 }}>
                                {c.distanceKm} km (~{c.etaMinutes}m)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Strip */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => handleBroadcast(batch)}
                      disabled={broadcasting === batch.donationId}
                      style={{
                        background: '#25D366',
                        color: '#ffffff',
                        fontWeight: 800,
                        fontSize: '11px',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        flex: 1,
                        justifyContent: 'center',
                      }}
                      title="Broadcast urgent mission alert to volunteer fleet on WhatsApp"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.814 2.8.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm6.837 5.766c-.001 3.769-3.067 6.835-6.837 6.835-1.168 0-2.273-.3-3.238-.838l-3.593.942.959-3.504c-.604-1.026-.948-2.203-.948-3.435.001-3.769 3.068-6.836 6.838-6.836 3.769 0 6.839 3.067 6.839 6.836z"/>
                      </svg>
                      {broadcasting === batch.donationId ? 'Broadcasting...' : isBroadcasted ? 'Re-Broadcast (WhatsApp)' : 'Emergency Fleet Broadcast'}
                    </button>

                    <a
                      href={gmapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '11px',
                        padding: '6px 10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'none',
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="3 11 22 2 13 21 11 13 3 11"/>
                      </svg>
                      GMaps
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
