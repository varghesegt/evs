import { useState } from 'react';
import { estimateFoodQuantity } from '../api/aiApi';

export default function AiQuantityEstimator({ onConfirmEstimate }) {
  const [topPhoto, setTopPhoto] = useState(null);
  const [sidePhoto, setSidePhoto] = useState(null);
  const [foodCategory, setFoodCategory] = useState('MIXED_MEAL');
  const [containerType, setContainerType] = useState('STANDARD_20L');
  const [customVolume, setCustomVolume] = useState('15');
  const [fillPercentage, setFillPercentage] = useState(75);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [confirmedWeight, setConfirmedWeight] = useState('');

  const handlePhotoUpload = (e, setPhoto) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setResult(null);

    try {
      const payload = {
        foodCategory,
        containerType,
        customVolumeLiters: containerType === 'CUSTOM' ? parseFloat(customVolume) : null,
        fillPercentage: parseFloat(fillPercentage),
        topViewPhotoBase64: topPhoto,
        sideViewPhotoBase64: sidePhoto,
      };

      const res = await estimateFoodQuantity(payload);
      setResult(res.data);
      setConfirmedWeight(res.data.estimatedMassMidpointKg.toString());
    } catch (err) {
      console.error('AI Estimation Error', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyEstimate = () => {
    if (!result) return;
    const finalKg = parseFloat(confirmedWeight) || result.estimatedMassMidpointKg;
    onConfirmEstimate({
      quantityKg: finalKg,
      foodCategory: result.detectedFoodCategory,
      estimatedServings: result.estimatedServingsMidpoint,
      confidenceScore: result.confidenceScore,
      containerType,
      aiEstimatedMassKg: result.estimatedMassMidpointKg,
    });
  };

  const containerOptions = [
    { id: 'STANDARD_5L', name: '5L Chafing Dish', capacity: 5 },
    { id: 'STANDARD_10L', name: '10L Catering Pot', capacity: 10 },
    { id: 'STANDARD_20L', name: '20L Feast Drum', capacity: 20 },
    { id: 'STANDARD_50L', name: '50L Large Feast Pot', capacity: 50 },
    { id: 'CUSTOM', name: 'Custom Volume', capacity: 'Custom' },
  ];

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid #cbd5e1',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      boxShadow: 'var(--shadow-md)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-3)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div>
          <div style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--color-primary)',
            letterSpacing: '0.05em',
          }}>
            Step 1 • AI Volumetric Engine
          </div>
          <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-text)', margin: '2px 0 0 0' }}>
            AI Food Quantity & Serving Estimator
          </h2>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '11px', padding: '4px 10px' }}>
          Engine v2.4 Active
        </span>
      </div>

      {/* Photo Upload Dropzones - Touch Optimized Stack */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        {/* Photo 1 */}
        <div style={{
          background: 'var(--color-bg)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed #cbd5e1',
          textAlign: 'center',
          transition: 'all 0.2s ease',
        }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
            Top View Photo (Required)
          </label>
          {topPhoto ? (
            <div style={{ position: 'relative' }}>
              <img src={topPhoto} alt="Top view" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              <button
                type="button"
                onClick={() => setTopPhoto(null)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-3)',
              cursor: 'pointer',
              minHeight: '80px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>Tap to Upload</span>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>Surface area</span>
              <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setTopPhoto)} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        {/* Photo 2 */}
        <div style={{
          background: 'var(--color-bg)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-lg)',
          border: '2px dashed #cbd5e1',
          textAlign: 'center',
          transition: 'all 0.2s ease',
        }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', marginBottom: 'var(--space-2)' }}>
            Side View Photo (Optional)
          </label>
          {sidePhoto ? (
            <div style={{ position: 'relative' }}>
              <img src={sidePhoto} alt="Side view" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              <button
                type="button"
                onClick={() => setSidePhoto(null)}
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-3)',
              cursor: 'pointer',
              minHeight: '80px',
            }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-primary)' }}>Tap to Upload</span>
              <span style={{ fontSize: '10px', color: 'var(--color-primary)', marginTop: '2px', fontWeight: 600 }}>±8% Error Bounding</span>
              <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setSidePhoto)} style={{ display: 'none' }} />
            </label>
          )}
        </div>
      </div>

      {/* Container Selection Chips (Touch Friendly) */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          Container Calibration Size
        </label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
          gap: 'var(--space-2)',
        }}>
          {containerOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setContainerType(opt.id)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: containerType === opt.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                background: containerType === opt.id ? 'var(--color-primary-bg)' : 'var(--color-surface)',
                color: containerType === opt.id ? 'var(--color-primary-dark)' : 'var(--color-text)',
                fontWeight: containerType === opt.id ? 700 : 500,
                fontSize: '12px',
                cursor: 'pointer',
                textAlign: 'center',
                minHeight: '44px',
                transition: 'all 0.15s ease',
              }}
            >
              {opt.name}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Capacity & Category Dropdowns */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
      }}>
        {containerType === 'CUSTOM' ? (
          <div>
            <label className="form-label" style={{ fontSize: '12px' }}>Custom Capacity (Liters)</label>
            <input
              type="number"
              className="form-input"
              style={{ fontSize: '13px', minHeight: '44px' }}
              value={customVolume}
              onChange={(e) => setCustomVolume(e.target.value)}
              placeholder="e.g. 15"
            />
          </div>
        ) : (
          <div>
            <label className="form-label" style={{ fontSize: '12px' }}>Food Density Profile</label>
            <select
              className="form-select"
              style={{ fontSize: '13px', minHeight: '44px' }}
              value={foodCategory}
              onChange={(e) => setFoodCategory(e.target.value)}
            >
              <option value="COOKED_RICE">Cooked Rice (0.80 kg/L)</option>
              <option value="COOKED_CURRY">Cooked Curry / Gravy (0.95 kg/L)</option>
              <option value="MIXED_MEAL">Mixed Meal / Biryani (0.85 kg/L)</option>
              <option value="COOKED_VEGETABLES">Cooked Vegetables (0.70 kg/L)</option>
              <option value="BREAD_BAKERY">Bread & Rotis (0.35 kg/L)</option>
              <option value="SWEETS_DESSERTS">Sweets & Desserts (0.90 kg/L)</option>
              <option value="DAIRY">Dairy & Milk (1.03 kg/L)</option>
            </select>
          </div>
        )}

        <div>
          <label className="form-label" style={{ fontSize: '12px' }}>Fill Level: {fillPercentage}%</label>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={fillPercentage}
            onChange={(e) => setFillPercentage(e.target.value)}
            style={{
              width: '100%',
              marginTop: '10px',
              accentColor: 'var(--color-primary)',
              height: '8px',
              borderRadius: '4px',
            }}
          />
        </div>
      </div>

      {/* Primary AI Analyze Button (Thumb-Friendly Tap Target) */}
      <button
        type="button"
        className="btn btn-primary btn-lg"
        style={{
          width: '100%',
          fontSize: '14px',
          fontWeight: 700,
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 12px rgba(13, 150, 104, 0.25)',
        }}
        onClick={handleAnalyze}
        disabled={analyzing}
      >
        {analyzing ? 'Running Volumetric Analysis...' : 'Run AI Volumetric & Serving Analysis'}
      </button>

      {/* AI Results Section */}
      {result && (
        <div style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-4)',
          background: '#f0fdf4',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid #bbf7d0',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-3)',
          }}>
            <div>
              <span style={{ fontSize: '10px', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>AI Detected Category</span>
              <h3 style={{ margin: '2px 0 0 0', fontSize: 'var(--font-size-md)', color: '#065f46', fontWeight: 800 }}>
                {result.foodDisplayName}
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-primary" style={{ fontSize: '12px', fontWeight: 700 }}>
                {result.confidenceScore}% Confidence
              </span>
              <span style={{ display: 'block', fontSize: '10px', color: '#047857', marginTop: '2px' }}>
                MAPE Error: {result.historicalModelErrorRate}%
              </span>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 'var(--space-3)',
            background: '#ffffff',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #dcfce7',
          }}>
            <div>
              <span style={{ fontSize: '11px', color: '#475569' }}>Estimated Mass Range</span>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#065f46' }}>
                {result.estimatedMassMinKg} – {result.estimatedMassMaxKg} kg
              </div>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Midpoint: {result.estimatedMassMidpointKg} kg</span>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: '#475569' }}>Estimated Servings</span>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: '#065f46' }}>
                ≈ {result.estimatedServingsMin} – {result.estimatedServingsMax}
              </div>
              <span style={{ fontSize: '10px', color: '#64748b' }}>Midpoint: ~{result.estimatedServingsMidpoint} meals</span>
            </div>
          </div>

          <p style={{ fontSize: '11px', color: '#047857', fontStyle: 'italic', margin: 'var(--space-3) 0 0 0', lineHeight: '1.4' }}>
            * {result.scientificNote}
          </p>

          {/* Verification & Fill Action */}
          <div style={{
            marginTop: 'var(--space-4)',
            paddingTop: 'var(--space-3)',
            borderTop: '1px dashed #a7f3d0',
          }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#065f46', marginBottom: 'var(--space-2)' }}>
              Donor Weight Verification
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <input
                type="number"
                step="0.1"
                className="form-input"
                style={{ fontSize: '14px', minHeight: '44px' }}
                value={confirmedWeight}
                onChange={(e) => setConfirmedWeight(e.target.value)}
                placeholder="Confirmed kg"
              />
              <button
                type="button"
                className="btn btn-accent btn-lg"
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-md)',
                  boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
                }}
                onClick={handleApplyEstimate}
              >
                Confirm & Auto-Fill Step 2 Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
