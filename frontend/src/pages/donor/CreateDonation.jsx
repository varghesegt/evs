import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import MapView from '../../components/MapView';
import AiQuantityEstimator from '../../components/AiQuantityEstimator';
import LiveArFoodScannerModal from '../../components/LiveArFoodScannerModal';
import { createDonation } from '../../api/donationApi';
import { getMapPins } from '../../api/analyticsApi';

const FOOD_CATEGORIES = [
  'COOKED_RICE', 'COOKED_CURRY', 'COOKED_VEGETABLES', 'BREAD_BAKERY',
  'FRUITS', 'RAW_VEGETABLES', 'DAIRY', 'SWEETS_DESSERTS',
  'BEVERAGES', 'PACKAGED_FOOD', 'MIXED_MEAL', 'OTHER',
];

const formatCategoryLabel = (cat) => cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function CreateDonation() {
  const navigate = useNavigate();
  const formSectionRef = useRef(null);
  const [activeStep, setActiveStep] = useState(1); // 1 = AI Estimation, 2 = Pickup & Location Details
  const [arScannerOpen, setArScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    foodName: '',
    foodCategory: 'MIXED_MEAL',
    quantityKg: '',
    description: '',
    packagingType: '',
    preparedAt: new Date().toISOString().slice(0, 16),
    pickupAddress: '',
    pickupLat: '',
    pickupLng: '',
  });

  const [ecosystemShelters, setEcosystemShelters] = useState([]);

  useEffect(() => {
    getMapPins()
      .then(res => {
        const shelters = (res.data || []).filter(p => p.type === 'ngo');
        setEcosystemShelters(shelters);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLocationSelect = ({ lat, lng, address }) => {
    setForm(prev => ({
      ...prev,
      pickupLat: lat,
      pickupLng: lng,
      pickupAddress: address ? address : prev.pickupAddress,
    }));
  };

  const handleConfirmAiEstimate = ({ quantityKg, foodCategory, foodName, estimatedServings, aiEstimatedMassKg, containerType, confidenceScore }) => {
    const containerLabel = containerType === 'STANDARD_5L' ? '5L Chafing Dish'
      : containerType === 'STANDARD_10L' ? '10L Catering Pot'
      : containerType === 'STANDARD_20L' ? '20L Feast Drum'
      : containerType === 'STANDARD_50L' ? '50L Large Cauldron'
      : 'Calibrated Vessel';

    setForm(prev => ({
      ...prev,
      quantityKg: quantityKg.toString(),
      foodName: prev.foodName || foodName || (foodCategory ? formatCategoryLabel(foodCategory) : ''),
      foodCategory: foodCategory || prev.foodCategory,
      packagingType: prev.packagingType || containerLabel,
      description: prev.description
        ? `${prev.description}\n[AI Vision: ${quantityKg} kg, ~${estimatedServings} meals, ${confidenceScore || 95}% Confidence]`
        : `AI Volumetric Vision: ${quantityKg} kg (~${estimatedServings} servings). AI Midpoint: ${aiEstimatedMassKg} kg in ${containerLabel}. Confidence: ${confidenceScore || 95}%.`,
    }));
    setSuccess(`AI Vision Estimate of ${quantityKg} kg (~${estimatedServings} meals) confirmed. Step 2 details auto-filled!`);
    setActiveStep(2);
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        ...form,
        quantityKg: parseFloat(form.quantityKg),
        pickupLat: form.pickupLat ? parseFloat(form.pickupLat) : null,
        pickupLng: form.pickupLng ? parseFloat(form.pickupLng) : null,
        preparedAt: new Date(form.preparedAt).toISOString().replace('Z', ''),
      };

      const res = await createDonation(payload);
      setSuccess(`Donation created successfully! Priority Score: ${res.data.priorityScore}/100. Freshness: ${res.data.freshnessHoursRemaining}h. QR Code: ${res.data.qrCode}`);
      setForm({
        foodName: '', foodCategory: 'MIXED_MEAL', quantityKg: '', description: '',
        packagingType: '', preparedAt: new Date().toISOString().slice(0, 16),
        pickupAddress: '', pickupLat: '', pickupLng: '',
      });
      setActiveStep(1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <h1>Create Food Donation</h1>
        <p>AI-assisted volumetric estimation and GPS pickup coordination</p>
      </div>

      {/* Mobile-First Step Progress Indicator Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-5)',
        background: 'var(--color-surface)',
        padding: '6px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: activeStep === 1 ? 'var(--color-primary)' : 'transparent',
            color: activeStep === 1 ? '#ffffff' : 'var(--color-text-secondary)',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            minHeight: '44px',
          }}
        >
          Step 1: AI Estimator
        </button>
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          style={{
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: activeStep === 2 ? 'var(--color-primary)' : 'transparent',
            color: activeStep === 2 ? '#ffffff' : 'var(--color-text-secondary)',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            minHeight: '44px',
          }}
        >
          Step 2: Location & Details
        </button>
      </div>

      {/* Success Notification Alert */}
      {success && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-primary-bg)',
          color: 'var(--color-primary-dark)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--font-size-sm)',
          marginBottom: 'var(--space-5)',
          border: '1px solid var(--color-primary-light)',
          fontWeight: 600,
        }}>
          {success}
        </div>
      )}

      {/* Error Notification Alert */}
      {error && (
        <div style={{
          padding: 'var(--space-3) var(--space-4)',
          background: 'var(--color-danger-bg)',
          color: 'var(--color-danger)',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--font-size-sm)',
          marginBottom: 'var(--space-5)',
          border: '1px solid var(--color-danger-light)',
          fontWeight: 600,
        }}>
          {error}
        </div>
      )}

      {/* Step 1 Container: AI Volumetric Food Estimator */}
      {activeStep === 1 && (
        <div style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <button
              type="button"
              onClick={() => setArScannerOpen(true)}
              className="btn"
              style={{
                width: '100%',
                minHeight: '48px',
                fontSize: '14px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
                cursor: 'pointer',
              }}
            >
              <span>📷</span>
              <span>Launch Live AR Camera Scanner (Auto-Bounding Box)</span>
            </button>
          </div>

          <AiQuantityEstimator onConfirmEstimate={handleConfirmAiEstimate} />
          
          <div style={{ marginTop: 'var(--space-4)', textAlign: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-lg"
              style={{ width: '100%', minHeight: '48px', fontWeight: 600 }}
              onClick={() => setActiveStep(2)}
            >
              Skip AI Estimation and Enter Details Manually
            </button>
          </div>
        </div>
      )}

      {/* Step 2 Container: Food Details & Interactive Map Location Picker */}
      {activeStep === 2 && (
        <div ref={formSectionRef} className="card" style={{
          border: '1px solid #cbd5e1',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-4)',
          boxShadow: 'var(--shadow-md)',
          animation: 'fadeIn 0.25s ease',
        }}>
          <div style={{
            paddingBottom: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
            borderBottom: '1px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
              Step 2 • Food & Pickup Details
            </div>
            <h2 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--color-text)', margin: '2px 0 0 0' }}>
              Donation Information & GPS Map Location
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Food Name & Category */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="cd-foodname">Food Name</label>
                <input
                  id="cd-foodname"
                  name="foodName"
                  className="form-input"
                  value={form.foodName}
                  onChange={handleChange}
                  placeholder="e.g. Marriage Feast Biryani"
                  required
                  style={{ minHeight: '48px', fontSize: '14px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cd-category">Category Density Profile</label>
                <select
                  id="cd-category"
                  name="foodCategory"
                  className="form-select"
                  value={form.foodCategory}
                  onChange={handleChange}
                  style={{ minHeight: '48px', fontSize: '14px' }}
                >
                  {FOOD_CATEGORIES.map(c => (
                    <option key={c} value={c}>{formatCategoryLabel(c)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity & Packaging Type */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="cd-qty">Confirmed Quantity (kg)</label>
                <input
                  id="cd-qty"
                  name="quantityKg"
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="form-input"
                  value={form.quantityKg}
                  onChange={handleChange}
                  placeholder="e.g. 15.0"
                  required
                  style={{ minHeight: '48px', fontSize: '14px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cd-packaging">Packaging Type</label>
                <input
                  id="cd-packaging"
                  name="packagingType"
                  className="form-input"
                  value={form.packagingType}
                  onChange={handleChange}
                  placeholder="e.g. Calibrated Steel Vessels"
                  style={{ minHeight: '48px', fontSize: '14px' }}
                />
              </div>
            </div>

            {/* Preparation Time */}
            <div className="form-group">
              <label className="form-label" htmlFor="cd-prepared">Preparation Time</label>
              <input
                id="cd-prepared"
                name="preparedAt"
                type="datetime-local"
                className="form-input"
                value={form.preparedAt}
                onChange={handleChange}
                required
                style={{ minHeight: '48px', fontSize: '14px' }}
              />
            </div>

            {/* Description & Notes */}
            <div className="form-group">
              <label className="form-label" htmlFor="cd-desc">Description & Portion Notes</label>
              <textarea
                id="cd-desc"
                name="description"
                className="form-textarea"
                value={form.description}
                onChange={handleChange}
                placeholder="Describe food condition, special handling, or portion notes..."
                style={{ minHeight: '90px', fontSize: '13px' }}
              />
            </div>

            {/* Interactive GPS Map Location Picker Card */}
            <div className="form-group" style={{ margin: 'var(--space-5) 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>
                  Interactive Map Location & Geocoding
                </label>
                <span className="badge badge-secondary" style={{ fontSize: '10px' }}>OpenStreetMap GPS</span>
              </div>

              {/* Quick Trichy Landmark Location Presets */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, alignSelf: 'center', marginRight: '4px' }}>
                  Quick Trichy Hubs:
                </span>
                {[
                  { name: 'Hotel Sangam, Cantonment', lat: 10.8055, lng: 78.6850, addr: 'Collector Office Road, Cantonment, Trichy' },
                  { name: 'SRM Hotel, TVS Tollgate', lat: 10.7985, lng: 78.6890, addr: 'Race Course Road, TVS Tollgate, Trichy' },
                  { name: 'Royal Mahal, Thillai Nagar', lat: 10.8295, lng: 78.6865, addr: 'Main Road, Thillai Nagar, Trichy' },
                  { name: 'A2B, Chathiram', lat: 10.8310, lng: 78.6940, addr: 'Chathiram Bus Stand Area, Trichy' },
                  { name: 'Central Bus Stand', lat: 10.7985, lng: 78.6815, addr: 'Central Bus Stand Terminal, Trichy' },
                  { name: 'Golden Palm, KK Nagar', lat: 10.7760, lng: 78.7050, addr: 'KK Nagar Main Road, Trichy' },
                  { name: 'NIT Trichy, Thuvakudi', lat: 10.7600, lng: 78.8150, addr: 'Tanjore Main Road, Thuvakudi, Trichy' },
                ].map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    className="btn btn-sm btn-secondary"
                    style={{ padding: '2px 8px', fontSize: '11px', minHeight: '26px' }}
                    onClick={() => handleLocationSelect({ lat: preset.lat, lng: preset.lng, address: preset.addr })}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              <MapView
                height="320px"
                interactivePicker={true}
                showFilters={false}
                markers={ecosystemShelters}
                selectedLocation={{
                  lat: form.pickupLat ? parseFloat(form.pickupLat) : null,
                  lng: form.pickupLng ? parseFloat(form.pickupLng) : null,
                  address: form.pickupAddress,
                }}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            {/* Address & Latitude/Longitude Display */}
            <div className="form-group">
              <label className="form-label" htmlFor="cd-address">Pickup Address</label>
              <input
                id="cd-address"
                name="pickupAddress"
                className="form-input"
                value={form.pickupAddress}
                onChange={handleChange}
                placeholder="Click map above or enter address..."
                required
                style={{ minHeight: '48px', fontSize: '14px' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="cd-lat">Latitude</label>
                <input
                  id="cd-lat"
                  name="pickupLat"
                  type="number"
                  step="any"
                  className="form-input"
                  value={form.pickupLat}
                  onChange={handleChange}
                  placeholder="Auto-filled"
                  style={{ minHeight: '44px', fontSize: '13px' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cd-lng">Longitude</label>
                <input
                  id="cd-lng"
                  name="pickupLng"
                  type="number"
                  step="any"
                  className="form-input"
                  value={form.pickupLng}
                  onChange={handleChange}
                  placeholder="Auto-filled"
                  style={{ minHeight: '44px', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* AI Engine Info Card */}
            <div style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--color-primary-bg)',
              borderRadius: 'var(--radius-lg)',
              fontSize: '12px',
              color: 'var(--color-primary-dark)',
              border: '1px solid var(--color-primary-light)',
            }}>
              <strong>AI Priority Engine:</strong> Will compute urgency score (0-100), remaining safe freshness hours, and auto-match nearby NGOs in Tiruchirappalli.
            </div>

            {/* Form Actions (Mobile First Tap Targets) */}
            <div style={{
              marginTop: 'var(--space-6)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}>
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{
                  minHeight: '52px',
                  fontSize: '15px',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 4px 14px rgba(13, 150, 104, 0.3)',
                }}
              >
                {loading ? 'Submitting Donation...' : 'Submit Food Donation'}
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-lg"
                onClick={() => setActiveStep(1)}
                style={{ minHeight: '48px', fontSize: '14px', fontWeight: 600 }}
              >
                Back to Step 1 (AI Estimator)
              </button>
            </div>
          </form>
        </div>
      )}

      <LiveArFoodScannerModal
        isOpen={arScannerOpen}
        onClose={() => setArScannerOpen(false)}
        onEstimateCaptured={handleConfirmAiEstimate}
      />
    </DashboardLayout>
  );
}
