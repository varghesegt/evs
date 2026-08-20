import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import MapView from '../../components/MapView';
import AiQuantityEstimator from '../../components/AiQuantityEstimator';
import { createDonation } from '../../api/donationApi';

const FOOD_CATEGORIES = [
  'COOKED_RICE', 'COOKED_CURRY', 'COOKED_VEGETABLES', 'BREAD_BAKERY',
  'FRUITS', 'RAW_VEGETABLES', 'DAIRY', 'SWEETS_DESSERTS',
  'BEVERAGES', 'PACKAGED_FOOD', 'MIXED_MEAL', 'OTHER',
];

const formatCategoryLabel = (cat) => cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default function CreateDonation() {
  const navigate = useNavigate();
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

  const handleConfirmAiEstimate = ({ quantityKg, foodCategory, estimatedServings, aiEstimatedMassKg }) => {
    setForm(prev => ({
      ...prev,
      quantityKg: quantityKg.toString(),
      foodCategory: foodCategory || prev.foodCategory,
      description: prev.description
        ? `${prev.description}\n[AI Calibrated Quantity: ${quantityKg} kg, Estimated ~${estimatedServings} meals]`
        : `AI Calibrated Volumetric Estimation: ${quantityKg} kg (estimated ~${estimatedServings} servings). AI Midpoint: ${aiEstimatedMassKg} kg.`,
    }));
    setSuccess(`AI Estimate of ${quantityKg} kg (~${estimatedServings} meals) successfully confirmed and applied to donation record.`);
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1>Create Food Donation</h1>
        <p>Volumetric AI food quantity & serving estimation with GPS interactive location map</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-6)' }}>
        {/* Scientific AI Food Quantity Estimator */}
        <AiQuantityEstimator onConfirmEstimate={handleConfirmAiEstimate} />

        <div className="card">
          {error && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-5)' }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{ padding: 'var(--space-3) var(--space-4)', background: 'var(--color-primary-bg)', color: 'var(--color-primary-dark)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-5)' }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="cd-foodname">Food Name</label>
                <input id="cd-foodname" name="foodName" className="form-input" value={form.foodName}
                       onChange={handleChange} placeholder="e.g. Traditional Marriage Feast" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cd-category">Category</label>
                <select id="cd-category" name="foodCategory" className="form-select" value={form.foodCategory} onChange={handleChange}>
                  {FOOD_CATEGORIES.map(c => (
                    <option key={c} value={c}>{formatCategoryLabel(c)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="cd-qty">Confirmed Quantity (kg)</label>
                <input id="cd-qty" name="quantityKg" type="number" step="0.1" min="0.1" className="form-input"
                       value={form.quantityKg} onChange={handleChange} placeholder="e.g. 12.5 (Auto-filled by AI)" required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cd-packaging">Packaging Type</label>
                <input id="cd-packaging" name="packagingType" className="form-input" value={form.packagingType}
                       onChange={handleChange} placeholder="e.g. Calibrated Steel Vessels" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cd-desc">Description & Portion Notes</label>
              <textarea id="cd-desc" name="description" className="form-textarea" value={form.description}
                        onChange={handleChange} placeholder="Describe food items, condition, and special notes" />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cd-prepared">Preparation Time</label>
              <input id="cd-prepared" name="preparedAt" type="datetime-local" className="form-input"
                     value={form.preparedAt} onChange={handleChange} required />
            </div>

            {/* Interactive Realtime GPS Map Location Picker */}
            <div className="form-group">
              <label className="form-label">Interactive Map Location & Geocoding</label>
              <MapView
                height="320px"
                interactivePicker={true}
                showFilters={false}
                selectedLocation={{
                  lat: form.pickupLat ? parseFloat(form.pickupLat) : null,
                  lng: form.pickupLng ? parseFloat(form.pickupLng) : null,
                  address: form.pickupAddress,
                }}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cd-address">Pickup Address</label>
              <input id="cd-address" name="pickupAddress" className="form-input" value={form.pickupAddress}
                     onChange={handleChange} placeholder="Click on map above or enter address" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="cd-lat">Pickup Latitude</label>
                <input id="cd-lat" name="pickupLat" type="number" step="any" className="form-input"
                       value={form.pickupLat} onChange={handleChange} placeholder="Auto-filled from map click" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="cd-lng">Pickup Longitude</label>
                <input id="cd-lng" name="pickupLng" type="number" step="any" className="form-input"
                       value={form.pickupLng} onChange={handleChange} placeholder="Auto-filled from map click" />
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-4)', background: 'var(--color-primary-bg)', borderRadius: 'var(--radius-md)', fontSize: 'var(--font-size-sm)', color: 'var(--color-primary-dark)' }}>
              AI Priority Engine will compute urgency score (0-100), remaining safe freshness hours, and auto-match nearby NGOs in Tiruchirappalli.
            </div>

            <div className="flex gap-3 mt-6" style={{ marginTop: 'var(--space-5)' }}>
              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Creating...' : 'Submit Food Donation'}
              </button>
              <button type="button" className="btn btn-secondary btn-lg" onClick={() => navigate('/donor')}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
