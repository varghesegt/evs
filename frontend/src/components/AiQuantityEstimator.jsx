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

  return (
    <div className="card" style={{ border: '2px solid var(--color-primary-light)', background: '#fafdfb', borderRadius: 'var(--radius-lg)' }}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
        <div>
          <h3 style={{ fontSize: 'var(--font-size-md)', color: 'var(--color-primary-dark)', margin: 0 }}>
            AI Food Quantity & Serving Estimator
          </h3>
          <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>
            Volumetric computer vision & calibrated density model with donor verification
          </p>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '10px' }}>Calibrated Engine v2.4</span>
      </div>

      <div style={{ marginTop: 'var(--space-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        {/* Photo Upload 1: Top View */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', textAlign: 'center' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 'var(--space-2)' }}>
            Top View Photo (Required)
          </label>
          {topPhoto ? (
            <div style={{ position: 'relative' }}>
              <img src={topPhoto} alt="Top view" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
              <button type="button" onClick={() => setTopPhoto(null)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
            </div>
          ) : (
            <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setTopPhoto)} style={{ fontSize: '11px', width: '100%' }} />
          )}
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>Determines surface fill area</span>
        </div>

        {/* Photo Upload 2: Side View */}
        <div style={{ background: 'var(--color-surface)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)', textAlign: 'center' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: 'var(--space-2)' }}>
            Side View Photo (Optional)
          </label>
          {sidePhoto ? (
            <div style={{ position: 'relative' }}>
              <img src={sidePhoto} alt="Side view" style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
              <button type="button" onClick={() => setSidePhoto(null)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '10px' }}>✕</button>
            </div>
          ) : (
            <input type="file" accept="image/*" onChange={(e) => handlePhotoUpload(e, setSidePhoto)} style={{ fontSize: '11px', width: '100%' }} />
          )}
          <span style={{ fontSize: '10px', color: 'var(--color-primary)', display: 'block', marginTop: '4px' }}>2-Photo system reduces error margin to ±8%</span>
        </div>
      </div>

      {/* Calibrated Container & Fill Level Controls */}
      <div style={{ marginTop: 'var(--space-4)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
        <div>
          <label className="form-label" style={{ fontSize: '12px' }}>Standard Calibrated Container</label>
          <select className="form-select" style={{ fontSize: '12px', padding: '6px 10px' }} value={containerType} onChange={(e) => setContainerType(e.target.value)}>
            <option value="STANDARD_5L">5L Buffet Chafing Dish</option>
            <option value="STANDARD_10L">10L Small Catering Pot</option>
            <option value="STANDARD_20L">20L Medium Wedding Drum</option>
            <option value="STANDARD_50L">50L Large Event Feast Pot</option>
            <option value="CUSTOM">Custom Container Volume</option>
          </select>
        </div>

        {containerType === 'CUSTOM' ? (
          <div>
            <label className="form-label" style={{ fontSize: '12px' }}>Custom Capacity (Liters)</label>
            <input type="number" className="form-input" style={{ fontSize: '12px', padding: '6px 10px' }} value={customVolume} onChange={(e) => setCustomVolume(e.target.value)} placeholder="e.g. 15" />
          </div>
        ) : (
          <div>
            <label className="form-label" style={{ fontSize: '12px' }}>Food Category Density</label>
            <select className="form-select" style={{ fontSize: '12px', padding: '6px 10px' }} value={foodCategory} onChange={(e) => setFoodCategory(e.target.value)}>
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
      </div>

      <div style={{ marginTop: 'var(--space-3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600 }}>
          <span>Fill Level: {fillPercentage}%</span>
          <span style={{ color: 'var(--color-text-muted)' }}>Estimated Volume: {((containerType === 'CUSTOM' ? parseFloat(customVolume) || 15 : parseInt(containerType.replace('STANDARD_', '').replace('L', ''))) * (fillPercentage / 100)).toFixed(1)} Liters</span>
        </div>
        <input type="range" min="10" max="100" step="5" value={fillPercentage} onChange={(e) => setFillPercentage(e.target.value)} style={{ width: '100%', marginTop: '4px', accentColor: 'var(--color-primary)' }} />
      </div>

      <button type="button" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-4)', fontSize: '13px', padding: '8px' }} onClick={handleAnalyze} disabled={analyzing}>
        {analyzing ? 'Running Volumetric Analysis...' : 'Run AI Volumetric & Serving Analysis'}
      </button>

      {/* AI Estimation Results Card */}
      {result && (
        <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'white', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', tracking: '0.5px' }}>AI Detected Food</span>
              <h4 style={{ margin: 0, fontSize: 'var(--font-size-md)', color: 'var(--color-primary-dark)' }}>
                {result.foodDisplayName}
              </h4>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-accent" style={{ fontSize: '11px' }}>{result.confidenceScore}% Confidence</span>
              <span style={{ display: 'block', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '2px' }}>MAPE Error: {result.historicalModelErrorRate}%</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', background: 'var(--color-primary-bg)', padding: 'var(--space-3)', borderRadius: 'var(--radius-sm)' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-primary-dark)' }}>Estimated Quantity Range</span>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                {result.estimatedMassMinKg} – {result.estimatedMassMaxKg} kg
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Midpoint: {result.estimatedMassMidpointKg} kg</span>
            </div>

            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-primary-dark)' }}>Estimated Servings</span>
              <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                ≈ {result.estimatedServingsMin} – {result.estimatedServingsMax} meals
              </div>
              <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>Midpoint: ~{result.estimatedServingsMidpoint} servings</span>
            </div>
          </div>

          <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic', margin: 'var(--space-3) 0 0 0' }}>
            * {result.scientificNote}
          </p>

          {/* Donor Verification Step */}
          <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px dashed var(--color-border)' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 'var(--space-2)' }}>
              Donor Verification & Actual Weight Confirmation
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <input
                type="number"
                step="0.1"
                className="form-input"
                style={{ fontSize: '13px', width: '130px' }}
                value={confirmedWeight}
                onChange={(e) => setConfirmedWeight(e.target.value)}
                placeholder="Confirmed kg"
              />
              <button type="button" className="btn btn-accent" style={{ fontSize: '12px', flex: 1 }} onClick={handleApplyEstimate}>
                Confirm & Auto-Fill Donation Form
              </button>
            </div>
            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', display: 'block', marginTop: '4px' }}>
              Your feedback is logged into our model calibration dataset to continuously refine estimation accuracy.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
