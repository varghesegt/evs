import { useState, useEffect } from 'react';
import { getDonorCertificate } from '../api/analyticsApi';

export default function EvsCertificateModal({ donorId = 1, isOpen, onClose }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && donorId) {
      setLoading(true);
      getDonorCertificate(donorId)
        .then(res => setCert(res.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [isOpen, donorId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="sidebar-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
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
        border: 'min(6px, 1.5vw) solid #0d9668',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(14px, 3vw, 28px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto',
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

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : cert ? (
          <div>
            {/* Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: 'var(--space-4)' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '2px', color: '#0d9668', textTransform: 'uppercase' }}>
                EcoShare AI Sustainability Alliance • Tiruchirappalli
              </div>
              <h1 style={{ fontSize: '28px', color: '#0f172a', margin: '8px 0 4px 0', fontFamily: 'Georgia, serif' }}>
                CERTIFICATE OF EVS CARBON OFFSET
              </h1>
              <p style={{ fontSize: '13px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                Recognizing Outstanding Food Surplus Rescue & Methane Mitigation Action
              </p>
            </div>

            {/* Recipient */}
            <div style={{ textAlign: 'center', margin: 'var(--space-5) 0' }}>
              <span style={{ fontSize: '13px', color: '#475569' }}>This Official Environmental Certificate is Awarded to</span>
              <h2 style={{ fontSize: '24px', color: '#0d9668', margin: '8px 0 4px 0', fontWeight: '800' }}>
                {cert.organizationName || cert.donorName}
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                In partnership with registered Tiruchirappalli redistribution shelters
              </p>
            </div>

            {/* Primary Impact Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 'var(--space-3)',
              background: '#f0fdf4',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #bbf7d0',
              textAlign: 'center',
            }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#065f46' }}>{cert.totalFoodRescuedKg} kg</div>
                <span style={{ fontSize: '11px', color: '#047857' }}>Food Rescued</span>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#065f46' }}>{cert.totalCo2eAvoidedKg} kg</div>
                <span style={{ fontSize: '11px', color: '#047857' }}>CO₂e Avoided</span>
              </div>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#065f46' }}>{cert.totalMealsSupported}</div>
                <span style={{ fontSize: '11px', color: '#047857' }}>Meals Provided</span>
              </div>
            </div>

            {/* IPCC Methodology Note */}
            <div style={{
              margin: 'var(--space-3) 0',
              padding: 'var(--space-2) var(--space-3)',
              background: '#fffbeb',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid #fde68a',
              fontSize: '10px',
              color: '#92400e',
              textAlign: 'center',
            }}>
              Emissions calculated using IPCC AR6 food category emission factors (1.9–3.2 kg CO₂e/kg) · CH₄ GWP Factor: 28× over 100-year period
            </div>

            {/* Physical Equivalencies */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: 'var(--space-3)',
              margin: 'var(--space-3) 0',
              textAlign: 'center',
            }}>
              <div style={{ background: '#f8fafc', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{cert.carKmNegatedEquivalency} km</div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Car Emissions Negated</span>
              </div>
              <div style={{ background: '#f8fafc', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{cert.treesPlantedEquivalency} trees/yr</div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Carbon Sequestration</span>
              </div>
              <div style={{ background: '#f8fafc', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{(cert.totalWaterSavedLiters / 1000).toFixed(1)} kL</div>
                <span style={{ fontSize: '10px', color: '#64748b' }}>Water Preserved</span>
              </div>
            </div>

            {/* Additional Metrics Row */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 'var(--space-3)',
              margin: 'var(--space-3) 0',
              textAlign: 'center',
            }}>
              <div style={{ background: '#fef3c7', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#92400e' }}>{cert.electricityHoursEquivalency} hrs</div>
                <span style={{ fontSize: '10px', color: '#b45309' }}>Clean Energy Saved (LED Hours)</span>
              </div>
              <div style={{ background: '#ede9fe', padding: 'var(--space-2)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#5b21b6' }}>{cert.totalLandfillPreventedKg} kg</div>
                <span style={{ fontSize: '10px', color: '#7c3aed' }}>Landfill Mass Diverted</span>
              </div>
            </div>

            {/* UN SDG Alignment Strip */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              margin: 'var(--space-3) 0',
              padding: 'var(--space-3)',
              background: '#f1f5f9',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
            }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#475569', alignSelf: 'center', marginRight: '4px' }}>UN SDG ALIGNMENT:</span>
              {[
                { num: 2, name: 'Zero Hunger', bg: '#dcfce7', color: '#166534' },
                { num: 6, name: 'Clean Water', bg: '#dbeafe', color: '#1e40af' },
                { num: 11, name: 'Sustainable Cities', bg: '#fef3c7', color: '#92400e' },
                { num: 12, name: 'Resp. Consumption', bg: '#ede9fe', color: '#5b21b6' },
                { num: 13, name: 'Climate Action', bg: '#fee2e2', color: '#991b1b' },
              ].map(sdg => (
                <span key={sdg.num} style={{
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: sdg.bg,
                  color: sdg.color,
                  fontWeight: 700,
                }}>
                  SDG {sdg.num}: {sdg.name}
                </span>
              ))}
            </div>

            {/* Feature 4: SHA-256 Cryptographic Audit Hash Strip */}
            {cert.sha256Hash && (
              <div style={{
                margin: 'var(--space-3) 0',
                padding: 'var(--space-3)',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #cbd5e1',
                fontSize: '10px',
              }}>
                <div style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                  SHA-256 Cryptographic Impact Hash (Tamper-Proof Audit Chain)
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#0d9668', wordBreak: 'break-all', fontWeight: 700 }}>
                  {cert.sha256Hash}
                </div>
                <div style={{ color: '#64748b', fontSize: '9px', marginTop: '2px' }}>
                  Cryptographically signed against EcoShare Impact Ledger v1. Verification endpoint active.
                </div>
              </div>
            )}

            {/* Certificate Footer Stamp */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 'var(--space-3)',
              paddingTop: 'var(--space-4)',
              borderTop: '2px dashed #cbd5e1',
              fontSize: '11px',
              color: '#64748b',
            }}>
              <div>
                <strong>Verification Code:</strong> {cert.certificateCode}<br/>
                <strong>Issue Date:</strong> {cert.issueDate}<br/>
                <strong>Methodology:</strong> IPCC AR6 · FAO SOFA 2023<br/>
                <strong>Compliance:</strong> Companies Act 2013, Sec. 135 CSR
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  border: '3px solid #0d9668',
                  borderRadius: '50%',
                  width: '72px',
                  height: '72px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0d9668',
                  fontWeight: '800',
                  fontSize: '9px',
                  textAlign: 'center',
                  transform: 'rotate(-10deg)',
                  background: '#f0fdf4',
                }}>
                  EVS<br/>OFFICIAL<br/>SEAL
                </div>
              </div>
            </div>

            {/* Print Action */}
            <div style={{ marginTop: 'var(--space-5)', display: 'flex', gap: 'var(--space-3)' }}>
              <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={handlePrint}>
                Print / Save PDF Certificate
              </button>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>Failed to load certificate.</div>
        )}
      </div>
    </div>
  );
}
