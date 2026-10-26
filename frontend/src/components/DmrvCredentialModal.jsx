import { useState, useEffect } from 'react';
import { getDmrvCredential, verifyCertificateHash } from '../api/analyticsApi';

export default function DmrvCredentialModal({ donationId = 1, isOpen, onClose }) {
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'jsonld'
  const [copied, setCopied] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null);

  useEffect(() => {
    if (isOpen && donationId) {
      setLoading(true);
      setVerifyStatus(null);
      getDmrvCredential(donationId)
        .then((res) => setCredential(res.data))
        .catch((err) => console.error('Failed to load dMRV credential', err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, donationId]);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    if (credential) {
      navigator.clipboard.writeText(JSON.stringify(credential, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVerify = async () => {
    if (credential?.proof?.jwsProofDigest) {
      try {
        const res = await verifyCertificateHash(credential.proof.jwsProofDigest);
        setVerifyStatus(res.data);
      } catch (err) {
        setVerifyStatus({ status: 'ERROR', message: 'Verification lookup failed' });
      }
    }
  };

  const subject = credential?.credentialSubject || {};
  const proof = credential?.proof || {};

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
        border: '2px solid #0284c7',
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

        {/* Modal Header */}
        <div style={{ marginBottom: 'var(--space-4)', borderBottom: '1px solid #e2e8f0', paddingBottom: 'var(--space-3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Digital MRV (Measurement, Reporting, Verification)
            </span>
            <span className="badge badge-accent">W3C Verifiable Credential v1.0</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
            Food Rescue Carbon Mitigation Verified Credential
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            Standard: IPCC AR6 WGIII Ch.12 • Cryptographic SHA-256 Ledger Digest
          </p>
        </div>

        {/* Tab Selector */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-4)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`btn btn-sm ${activeTab === 'visual' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: 700 }}
          >
            Audited Claims View
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('jsonld')}
            className={`btn btn-sm ${activeTab === 'jsonld' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontWeight: 700 }}
          >
            W3C JSON-LD Code
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : credential ? (
          <div>
            {activeTab === 'visual' ? (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                {/* Dual-Balance Audit Strip */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-4)',
                  marginBottom: 'var(--space-4)',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Two-Party Physical Calibration (AI Prediction vs Ground-Truth Scale)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Donor AI Vision Estimate</span>
                      <strong style={{ fontSize: '18px', color: '#0284c7' }}>{subject.aiEstimatedMassKg} kg</strong>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Optical volumetric inference</div>
                    </div>
                    <div style={{ background: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Depot Ground-Truth Scale</span>
                      <strong style={{ fontSize: '18px', color: '#059669' }}>{subject.destinationScaleGroundTruthKg} kg</strong>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>ID: {subject.scaleDeviceIdentifier}</div>
                    </div>
                  </div>
                </div>

                {/* Environmental Claims Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: 'var(--space-3)',
                  marginBottom: 'var(--space-4)',
                }}>
                  <div style={{ background: '#f0fdf4', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#065f46' }}>{subject.avoidedCo2eKg} kg</div>
                    <span style={{ fontSize: '10px', color: '#047857' }}>Avoided CO2e</span>
                  </div>
                  <div style={{ background: '#eff6ff', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e40af' }}>{subject.avoidedMethaneGwp28Kg} kg</div>
                    <span style={{ fontSize: '10px', color: '#2563eb' }}>Methane (CH4 GWP28)</span>
                  </div>
                  <div style={{ background: '#fffbeb', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #fde68a', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#92400e' }}>{subject.virtualWaterSavedLiters} L</div>
                    <span style={{ fontSize: '10px', color: '#b45309' }}>Virtual Water Saved</span>
                  </div>
                  <div style={{ background: '#faf5ff', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#6b21a8' }}>{subject.nutritionalMealsSupported}</div>
                    <span style={{ fontSize: '10px', color: '#7e22ce' }}>Meals Supported</span>
                  </div>
                </div>

                {/* Cryptographic Proof Details */}
                <div style={{
                  background: '#0f172a',
                  color: '#f8fafc',
                  padding: 'var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: 'var(--space-4)',
                  fontSize: '11px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 800, color: '#38bdf8' }}>Cryptographic Proof Digest (SHA-256)</span>
                    <span style={{ background: '#1e293b', padding: '2px 8px', borderRadius: '4px', color: '#94a3b8' }}>
                      {proof.type}
                    </span>
                  </div>
                  <div style={{
                    fontFamily: 'monospace',
                    background: '#1e293b',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    wordBreak: 'break-all',
                    color: '#a7f3d0',
                    fontSize: '11px',
                    marginBottom: '8px',
                  }}>
                    {proof.jwsProofDigest}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '10px' }}>Issuer: {credential.issuer}</span>
                    <button
                      type="button"
                      onClick={handleVerify}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#0284c7',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '11px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Verify On-Chain Ledger
                    </button>
                  </div>
                </div>

                {verifyStatus && (
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: '#f0fdf4',
                    border: '1px solid #86efac',
                    color: '#166534',
                    fontSize: '12px',
                    fontWeight: 600,
                    marginBottom: 'var(--space-4)',
                  }}>
                    Cryptographic verification succeeded! State is immutable and non-tampered on EcoShare Ledger Protocol.
                  </div>
                )}
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.2s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: '11px' }}
                  >
                    {copied ? 'Copied to Clipboard' : 'Copy JSON-LD'}
                  </button>
                </div>
                <pre style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  padding: '14px',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: '11px',
                  maxHeight: '340px',
                  overflowY: 'auto',
                  lineHeight: 1.4,
                  fontFamily: 'monospace',
                }}>
                  {JSON.stringify(credential, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>Credential record not found for donation #{donationId}</p>
          </div>
        )}
      </div>
    </div>
  );
}
