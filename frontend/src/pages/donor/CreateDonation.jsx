import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import MapView from '../../components/MapView';
import AiQuantityEstimator from '../../components/AiQuantityEstimator';
import LiveArFoodScannerModal from '../../components/LiveArFoodScannerModal';
import { createDonation } from '../../api/donationApi';
import { getMapPins } from '../../api/analyticsApi';
import { playSuccessChime, playRadarChime } from '../../utils/soundEffects';
import { openInGoogleMaps, getGoogleMapsNavigationUrl } from '../../utils/gmapsUtils';

const FOOD_CATEGORIES = [
  { id: 'COOKED_RICE', label: 'Rice & Biryani', icon: '', desc: 'Biryani, Pulao, Steamed Rice', density: '0.85 kg/L' },
  { id: 'COOKED_CURRY', label: 'Curry & Gravy', icon: '', desc: 'Sambar, Dal, Kurma, Gravy', density: '1.05 kg/L' },
  { id: 'BREAD_BAKERY', label: 'Breads & Roti', icon: '', desc: 'Chapati, Naan, Parotta, Bread', density: '0.45 kg/L' },
  { id: 'MIXED_MEAL', label: 'Mixed Meals / Thali', icon: '', desc: 'Complete Meals, Full Lunch', density: '0.75 kg/L' },
  { id: 'COOKED_VEGETABLES', label: 'Cooked Veg & Kootu', icon: '', desc: 'Stir fry, Poriyal, Kootu', density: '0.70 kg/L' },
  { id: 'RAW_VEGETABLES', label: 'Raw Veg & Produce', icon: '', desc: 'Uncooked Vegetables, Greens', density: '0.50 kg/L' },
  { id: 'FRUITS', label: 'Fresh Fruits', icon: '', desc: 'Bananas, Apples, Oranges', density: '0.65 kg/L' },
  { id: 'DAIRY', label: 'Dairy & Desserts', icon: '', desc: 'Curd, Paneer, Payasam, Sweets', density: '1.02 kg/L' },
  { id: 'SWEETS_DESSERTS', label: 'Traditional Sweets', icon: '', desc: 'Halwa, Laddu, Kesari', density: '1.10 kg/L' },
  { id: 'PACKAGED_FOOD', label: 'Packaged & Dry', icon: '', desc: 'Sealed snacks, dry goods', density: '0.40 kg/L' },
  { id: 'BEVERAGES', label: 'Juices & Beverages', icon: '', desc: 'Juice, Buttermilk, Tea', density: '1.00 kg/L' },
  { id: 'OTHER', label: 'Other Culinary', icon: '', desc: 'Specialty culinary items', density: 'Variable' },
];

const CATERING_VESSELS = [
  { id: 'STANDARD_5L', name: '5L Chafing Dish', capacityKg: 4.0, icon: '', note: '~10 Meals' },
  { id: 'STANDARD_10L', name: '10L Catering Pot', capacityKg: 8.5, icon: '', note: '~21 Meals' },
  { id: 'STANDARD_20L', name: '20L Feast Drum', capacityKg: 17.0, icon: '', note: '~42 Meals' },
  { id: 'STANDARD_50L', name: '50L Cauldron', capacityKg: 42.0, icon: '', note: '~105 Meals' },
];

const QUICK_TRICHY_HUBS = [
  { name: 'Hotel Sangam, Cantonment', lat: 10.8055, lng: 78.6850, addr: 'Collector Office Road, Cantonment, Trichy', tag: 'Hotel' },
  { name: 'Royal Mahal, Thillai Nagar', lat: 10.8295, lng: 78.6865, addr: 'Main Road, Thillai Nagar, Trichy', tag: 'Hall' },
  { name: 'SRM Hotel, TVS Tollgate', lat: 10.7985, lng: 78.6890, addr: 'Race Course Road, TVS Tollgate, Trichy', tag: 'Hotel' },
  { name: 'A2B Chathiram Stand', lat: 10.8310, lng: 78.6940, addr: 'Chathiram Bus Stand Corridor, Trichy', tag: 'Dining' },
  { name: 'Central Bus Stand Depot', lat: 10.7985, lng: 78.6815, addr: 'Central Bus Stand Terminal, Trichy', tag: 'Transit' },
  { name: 'Golden Palm, KK Nagar', lat: 10.7760, lng: 78.7050, addr: 'KK Nagar Main Road, Trichy', tag: 'Hall' },
  { name: 'NIT Trichy, Thuvakudi', lat: 10.7600, lng: 78.8150, addr: 'Tanjore Main Road, Thuvakudi, Trichy', tag: 'Campus' },
  { name: 'Srirangam Temple North', lat: 10.8620, lng: 78.6920, addr: 'North Chithirai St, Srirangam, Trichy', tag: 'Temple' },
];

const FOOD_NAME_PRESETS = [
  'Marriage Feast Biryani',
  'Temple Annadhanam Sambar Rice',
  'Executive Lunch Buffet Meals',
  'Fresh Chapati & Dal Tadka',
  'Evening Snacks & Sweets Box',
];

const QUALITY_TAGS = [
  { id: 'fresh', label: 'Freshly Cooked (< 2h)', icon: '' },
  { id: 'warm', label: 'Insulated Warm (> 60°C)', icon: '' },
  { id: 'chilled', label: 'Refrigerated (< 4°C)', icon: '' },
  { id: 'veg', label: '100% Pure Veg', icon: '' },
  { id: 'sealed', label: 'Sealed Containers', icon: '' },
  { id: 'halal', label: 'Halal Certified', icon: '' },
];

export default function CreateDonation() {
  const navigate = useNavigate();
  const formSectionRef = useRef(null);

  // Flow State
  const [activeStep, setActiveStep] = useState(1); // 1 = Food & Volume, 2 = Pickup & Dispatch
  const [aiToolMode, setAiToolMode] = useState('express'); // 'express' | 'ai_photo'
  const [arScannerOpen, setArScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdDonation, setCreatedDonation] = useState(null);

  // Form State
  const [form, setForm] = useState({
    foodName: '',
    foodCategory: 'COOKED_RICE',
    quantityKg: '15.0',
    description: '',
    packagingType: 'Calibrated Steel Vessels',
    preparedAt: new Date().toISOString().slice(0, 16),
    pickupAddress: 'Collector Office Road, Cantonment, Trichy',
    pickupLat: 10.8055,
    pickupLng: 78.6850,
  });

  const [selectedQualityTags, setSelectedQualityTags] = useState(['fresh', 'warm', 'veg']);
  const [selectedVessel, setSelectedVessel] = useState('STANDARD_20L');
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState('');
  const [ecosystemShelters, setEcosystemShelters] = useState([]);

  useEffect(() => {
    getMapPins()
      .then(res => {
        const shelters = (res.data || []).filter(p => p.type === 'ngo');
        setEcosystemShelters(shelters);
      })
      .catch(() => {});
  }, []);

  // Real-time Impact Computations
  const quantityNum = parseFloat(form.quantityKg) || 0;
  const estimatedMeals = Math.max(1, Math.round(quantityNum * 2.5));
  const co2eSaved = (quantityNum * 2.5).toFixed(1);
  const waterSaved = Math.round(quantityNum * 80);
  const isUrgentPriority = quantityNum >= 20;

  // Step 1 Validation
  const isStep1Valid = form.foodName.trim().length > 0 && quantityNum > 0;
  // Step 2 Validation
  const isStep2Valid = form.pickupAddress.trim().length > 0 && form.pickupLat && form.pickupLng;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCategorySelect = (catId) => {
    setForm(prev => {
      const catObj = FOOD_CATEGORIES.find(c => c.id === catId);
      return {
        ...prev,
        foodCategory: catId,
        foodName: prev.foodName || (catObj ? catObj.label : ''),
      };
    });
  };

  const handleVesselSelect = (vessel) => {
    setSelectedVessel(vessel.id);
    setForm(prev => ({
      ...prev,
      quantityKg: vessel.capacityKg.toString(),
      packagingType: vessel.name,
    }));
  };

  const adjustQuantity = (delta) => {
    const cur = parseFloat(form.quantityKg) || 0;
    const next = Math.max(0.5, Math.round((cur + delta) * 10) / 10);
    setForm(prev => ({ ...prev, quantityKg: next.toString() }));
  };

  const toggleQualityTag = (tagId) => {
    setSelectedQualityTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handlePrepTimeOffset = (hoursAgo) => {
    const d = new Date(Date.now() - hoursAgo * 3600000);
    setForm(prev => ({
      ...prev,
      preparedAt: d.toISOString().slice(0, 16),
    }));
  };

  const handleLocationSelect = ({ lat, lng, address }) => {
    setForm(prev => ({
      ...prev,
      pickupLat: lat,
      pickupLng: lng,
      pickupAddress: address ? address : prev.pickupAddress,
    }));
  };

  // 1-Tap Geolocation Auto-Detection
  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      setGpsFeedback('GPS Geolocation is not supported by your browser.');
      return;
    }

    setGpsDetecting(true);
    setGpsFeedback('Triangulating GPS coordinates in Tiruchirappalli...');
    playRadarChime();

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const lat = parseFloat(latitude.toFixed(6));
        const lng = parseFloat(longitude.toFixed(6));

        // Find nearest known Trichy Hub
        let nearestHub = null;
        let minDistanceKm = Infinity;
        for (const hub of QUICK_TRICHY_HUBS) {
          const d = Math.hypot(lat - hub.lat, lng - hub.lng) * 111;
          if (d < minDistanceKm) {
            minDistanceKm = d;
            nearestHub = hub;
          }
        }

        let resolvedAddress = `GPS Location: ${lat}, ${lng} (±${Math.round(accuracy)}m)`;
        if (nearestHub && minDistanceKm < 2.0) {
          resolvedAddress = `Near ${nearestHub.name} (~${Math.round(minDistanceKm * 1000)}m), Trichy`;
        }

        setForm(prev => ({
          ...prev,
          pickupLat: lat,
          pickupLng: lng,
          pickupAddress: resolvedAddress,
        }));
        setGpsDetecting(false);
        setGpsFeedback(`Location locked (±${Math.round(accuracy)}m accuracy)`);
        playSuccessChime();
      },
      (err) => {
        console.warn('GPS detection failed:', err);
        setGpsDetecting(false);
        setGpsFeedback('Could not fetch exact GPS. Select a nearby Trichy Hub below.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const handleConfirmAiEstimate = ({
    quantityKg,
    foodCategory,
    foodName,
    estimatedServings,
    aiEstimatedMassKg,
    containerType,
    confidenceScore,
  }) => {
    const containerLabel = containerType === 'STANDARD_5L' ? '5L Chafing Dish'
      : containerType === 'STANDARD_10L' ? '10L Catering Pot'
      : containerType === 'STANDARD_20L' ? '20L Feast Drum'
      : containerType === 'STANDARD_50L' ? '50L Large Cauldron'
      : 'Calibrated Vessel';

    setForm(prev => ({
      ...prev,
      quantityKg: quantityKg.toString(),
      foodName: prev.foodName || foodName || (foodCategory ? foodCategory.replace(/_/g, ' ') : ''),
      foodCategory: foodCategory || prev.foodCategory,
      packagingType: prev.packagingType || containerLabel,
      description: prev.description
        ? `${prev.description}\n[AI Vision: ${quantityKg} kg, ~${estimatedServings} meals, ${confidenceScore || 95}% Confidence]`
        : `AI Volumetric Vision: ${quantityKg} kg (~${estimatedServings} servings). AI Midpoint: ${aiEstimatedMassKg} kg in ${containerLabel}. Confidence: ${confidenceScore || 95}%.`,
    }));

    setSuccess(`AI Vision confirmed ${quantityKg} kg (~${estimatedServings} meals). Transferred to form!`);
    playSuccessChime();
    setActiveStep(2);
    setTimeout(() => {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Build composite notes including quality tags
      const tagLabels = selectedQualityTags
        .map(t => QUALITY_TAGS.find(q => q.id === t)?.label)
        .filter(Boolean);
      const tagsNote = tagLabels.length > 0 ? `\n[Handling: ${tagLabels.join(' • ')}]` : '';
      const finalDescription = (form.description || '') + tagsNote;

      const payload = {
        ...form,
        quantityKg: parseFloat(form.quantityKg),
        pickupLat: form.pickupLat ? parseFloat(form.pickupLat) : 10.8055,
        pickupLng: form.pickupLng ? parseFloat(form.pickupLng) : 78.6850,
        preparedAt: new Date(form.preparedAt).toISOString().replace('Z', ''),
        description: finalDescription.trim(),
      };

      const res = await createDonation(payload);
      playSuccessChime();
      setCreatedDonation(res.data);
      setSuccess(`Donation dispatched successfully! Priority Score: ${res.data.priorityScore || 90}/100.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch food donation. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      {/* Mobile Top Navigation & Hero Banner */}
      <div style={{
        marginBottom: 'var(--space-4)',
        background: 'linear-gradient(135deg, rgba(13, 150, 104, 0.08) 0%, rgba(2, 132, 199, 0.08) 100%)',
        padding: '16px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(13, 150, 104, 0.15)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
          <div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              background: 'var(--color-primary-bg)',
              color: 'var(--color-primary-dark)',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '6px',
              border: '1px solid var(--color-primary-light)',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block' }} />
              Tiruchirappalli Surplus Dispatch
            </span>
            <h1 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.85rem)', margin: 0, fontWeight: 800 }}>
              Donate Surplus Food
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              1-tap mobile dispatch with AI vision & GPS courier matching
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link
              to="/donor/history"
              className="btn btn-sm btn-secondary"
              style={{ minHeight: '38px', fontSize: '12px', fontWeight: 700 }}
            >
              History
            </Link>
          </div>
        </div>
      </div>

      {/* SUCCESS CELEBRATION VIEW */}
      {createdDonation ? (
        <div style={{
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-2xl)',
          padding: '24px 18px',
          border: '2px solid #10b981',
          boxShadow: '0 12px 30px rgba(16, 185, 129, 0.15)',
          animation: 'fadeIn 0.3s ease',
          textAlign: 'center',
          marginBottom: 'var(--space-6)',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            margin: '0 auto 16px auto',
            boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
          }}>
            OK
          </div>

          <span className="badge badge-success" style={{ fontSize: '12px', padding: '4px 12px', fontWeight: 800 }}>
            RESCUE MISSION DISPATCHED
          </span>

          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '12px 0 6px 0', color: '#0f172a' }}>
            {createdDonation.foodName || form.foodName} Registered!
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '440px', margin: '0 auto 20px auto' }}>
            Volunteers and nearby recipient shelters in Tiruchirappalli have been notified via AI priority dispatch.
          </p>

          {/* Quick Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            marginBottom: '20px',
            maxWidth: '480px',
            margin: '0 auto 20px auto',
          }}>
            <div style={{ background: '#f8fafc', padding: '12px 6px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0d9668' }}>
                {createdDonation.quantityKg || form.quantityKg} kg
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Food Weight</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 6px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>
                ~{Math.round((parseFloat(createdDonation.quantityKg) || quantityNum) * 2.5)}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>Meals Fed</div>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 6px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#d97706' }}>
                {createdDonation.priorityScore || 90}/100
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>AI Priority</div>
            </div>
          </div>

          {/* QR Code Handshake Badge */}
          {createdDonation.qrCode && (
            <div style={{
              background: '#f1f5f9',
              padding: '12px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '24px',
              border: '1px dashed #cbd5e1',
            }}>
              
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>VERIFICATION QR CODE</div>
                <div style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' }}>
                  {createdDonation.qrCode}
                </div>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '380px', margin: '0 auto' }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/donor')}
              style={{ minHeight: '50px', fontSize: '15px', fontWeight: 800, borderRadius: '14px' }}
            >
              Go to Donor Dashboard
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setCreatedDonation(null);
                setForm({
                  foodName: '',
                  foodCategory: 'COOKED_RICE',
                  quantityKg: '15.0',
                  description: '',
                  packagingType: 'Calibrated Steel Vessels',
                  preparedAt: new Date().toISOString().slice(0, 16),
                  pickupAddress: 'Collector Office Road, Cantonment, Trichy',
                  pickupLat: 10.8055,
                  pickupLng: 78.6850,
                });
                setActiveStep(1);
              }}
              style={{ minHeight: '44px', fontSize: '13px', fontWeight: 700 }}
            >
              Create Another Donation
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* STEPPER PROGRESS TABS (Mobile First Ergonomics) */}
          <div className="donor-create-stepper-tabs" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: 'var(--space-4)',
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
                padding: '10px 8px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: activeStep === 1 ? 'var(--color-primary)' : 'transparent',
                color: activeStep === 1 ? '#ffffff' : 'var(--color-text-secondary)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>{isStep1Valid ? 'Complete' : 'Step 1'}</span>
              <span>1. Food & Volume</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(2)}
              style={{
                padding: '10px 8px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: activeStep === 2 ? 'var(--color-primary)' : 'transparent',
                color: activeStep === 2 ? '#ffffff' : 'var(--color-text-secondary)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s ease',
                minHeight: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <span>{isStep2Valid ? 'Complete' : 'Step 2'}</span>
              <span>2. Pickup & Map</span>
            </button>
          </div>

          {/* Quick Notifications */}
          {error && (
            <div style={{
              padding: '12px 16px',
              background: '#fef2f2',
              color: '#dc2626',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '16px',
              border: '1px solid #fecaca',
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: '12px 16px',
              background: '#f0fdf4',
              color: '#166534',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '16px',
              border: '1px solid #bbf7d0',
            }}>
              {success}
            </div>
          )}

          {/* AI ESTIMATION TOOL MODES (Live AR Scanner or Photo Upload) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: 'var(--space-4)',
          }}>
            <button
              type="button"
              onClick={() => setArScannerOpen(true)}
              style={{
                padding: '12px 8px',
                minHeight: '52px',
                fontSize: '13px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                cursor: 'pointer',
              }}
            >
              
              <span>Live AR Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setAiToolMode(aiToolMode === 'ai_photo' ? 'express' : 'ai_photo')}
              style={{
                padding: '12px 8px',
                minHeight: '52px',
                fontSize: '13px',
                fontWeight: 800,
                background: aiToolMode === 'ai_photo' ? '#0284c7' : 'var(--color-surface)',
                color: aiToolMode === 'ai_photo' ? '#ffffff' : 'var(--color-secondary)',
                border: '1px solid #0284c7',
                borderRadius: 'var(--radius-xl)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              
              <span>{aiToolMode === 'ai_photo' ? 'Hide AI Photo Tool' : 'Photo AI Estimator'}</span>
            </button>
          </div>

          {/* Expandable Photo AI Estimator */}
          {aiToolMode === 'ai_photo' && (
            <div style={{ marginBottom: 'var(--space-5)', animation: 'fadeIn 0.25s ease' }}>
              <AiQuantityEstimator onConfirmEstimate={handleConfirmAiEstimate} />
            </div>
          )}

          {/* Responsive Dual-Column Split Container (Side-by-side on desktop, stepped on mobile) */}
          <div className="donor-create-container">
            {/* ============================================================
                PANEL 1: FOOD CLASSIFICATION & VOLUME SPECIFICATION
                ============================================================ */}
            <div className={`donor-create-panel ${activeStep === 1 ? '' : 'hide-mobile'}`} style={{ animation: 'fadeIn 0.25s ease' }}>
              {/* Card 1: Food Title & Quick Preset Pills */}
              <div className="card" style={{
                borderRadius: 'var(--radius-xl)',
                padding: '16px',
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label className="form-label" htmlFor="food-name-input" style={{ margin: 0, fontWeight: 800, fontSize: '14px' }}>
                    Food Item Name *
                  </label>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>e.g. Biryani, Rice, Roti</span>
                </div>

                <input
                  id="food-name-input"
                  name="foodName"
                  className="form-input"
                  value={form.foodName}
                  onChange={handleChange}
                  placeholder="e.g. Marriage Feast Biryani"
                  required
                  style={{
                    minHeight: '50px',
                    fontSize: '16px', // Prevents iOS Safari auto-zoom
                    borderRadius: '12px',
                    fontWeight: 600,
                  }}
                />

                {/* Quick Food Name Chips */}
                <div style={{
                  display: 'flex',
                  gap: '6px',
                  overflowX: 'auto',
                  marginTop: '10px',
                  paddingBottom: '4px',
                  WebkitOverflowScrolling: 'touch',
                }}>
                  {FOOD_NAME_PRESETS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, foodName: name }))}
                      style={{
                        padding: '4px 10px',
                        background: form.foodName === name ? '#f0fdf4' : '#f8fafc',
                        border: form.foodName === name ? '1px solid #10b981' : '1px solid #e2e8f0',
                        color: form.foodName === name ? '#0d9668' : '#475569',
                        borderRadius: '9999px',
                        fontSize: '11px',
                        fontWeight: 700,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        minHeight: '32px',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card 2: Visual Food Category Cards (1-Tap Selection) */}
              <div className="card" style={{
                borderRadius: 'var(--radius-xl)',
                padding: '16px',
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                      Food Category & Density Profile
                    </h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                      Calibrates volumetric density for recipient nutritional balance
                    </p>
                  </div>
                  <span className="badge badge-primary" style={{ fontSize: '11px' }}>
                    {FOOD_CATEGORIES.find(c => c.id === form.foodCategory)?.density || 'Density'}
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '8px',
                }}>
                  {FOOD_CATEGORIES.map((cat) => {
                    const isSelected = form.foodCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategorySelect(cat.id)}
                        style={{
                          padding: '10px 8px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0d9668' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0fdf4' : '#ffffff',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                          minHeight: '74px',
                          position: 'relative',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          
                          {isSelected && (
                            <span style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: '#0d9668',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 900,
                            }}>
                              OK
                            </span>
                          )}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: isSelected ? '#065f46' : '#1e293b',
                          lineHeight: 1.2,
                        }}>
                          {cat.label}
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b', lineHeight: 1.1 }}>
                          {cat.density}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card 3: Calibrated Catering Vessels & Weight Stepper */}
              <div className="card" style={{
                borderRadius: 'var(--radius-xl)',
                padding: '16px',
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                    1-Tap Catering Vessel Presets
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Standard Indian Kitchen Pots</span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  marginBottom: '16px',
                }}>
                  {CATERING_VESSELS.map((vessel) => {
                    const isSelected = selectedVessel === vessel.id;
                    return (
                      <button
                        key={vessel.id}
                        type="button"
                        onClick={() => handleVesselSelect(vessel)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #0284c7' : '1px solid #e2e8f0',
                          background: isSelected ? '#f0f9ff' : '#f8fafc',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          minHeight: '54px',
                        }}
                      >
                        
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                            {vessel.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
                            ~{vessel.capacityKg} kg • {vessel.note}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Weight Stepper Controls (Thumb-friendly +/-) */}
                <div style={{
                  background: '#f8fafc',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="form-label" htmlFor="qty-stepper-input" style={{ margin: 0, fontWeight: 800, fontSize: '13px' }}>
                      Confirmed Total Weight (kg) *
                    </label>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0d9668' }}>
                      ~{estimatedMeals} Servings
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => adjustQuantity(-5)}
                      style={{
                        width: '44px',
                        height: '48px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        color: '#475569',
                      }}
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustQuantity(-1)}
                      style={{
                        width: '44px',
                        height: '48px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '18px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        color: '#475569',
                      }}
                    >
                      -1
                    </button>

                    <input
                      id="qty-stepper-input"
                      name="quantityKg"
                      type="number"
                      step="0.5"
                      min="0.5"
                      inputMode="decimal"
                      value={form.quantityKg}
                      onChange={handleChange}
                      style={{
                        flex: 1,
                        minHeight: '48px',
                        textAlign: 'center',
                        fontSize: '20px',
                        fontWeight: 800,
                        borderRadius: '10px',
                        border: '2px solid #0d9668',
                        background: '#ffffff',
                        color: '#0f172a',
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => adjustQuantity(+1)}
                      style={{
                        width: '44px',
                        height: '48px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '18px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        color: '#475569',
                      }}
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustQuantity(+5)}
                      style={{
                        width: '44px',
                        height: '48px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        background: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        color: '#475569',
                      }}
                    >
                      +5
                    </button>
                  </div>
                </div>
              </div>

              {/* Card 4: Dynamic Live Environmental & Social Impact HUD */}
              <div style={{
                background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
                color: '#ffffff',
                borderRadius: 'var(--radius-xl)',
                padding: '16px',
                marginBottom: 'var(--space-4)',
                boxShadow: '0 8px 20px rgba(6, 95, 70, 0.25)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    
                    <span style={{ fontSize: '13px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Real-Time Impact Forecast
                    </span>
                  </div>
                  <span style={{
                    background: isUrgentPriority ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}>
                    {isUrgentPriority ? 'Urgent Priority' : 'Standard Priority'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '10px 4px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '19px', fontWeight: 800 }}>~{estimatedMeals}</div>
                    <div style={{ fontSize: '10px', opacity: 0.9, fontWeight: 600 }}>Meals Fed</div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '10px 4px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '19px', fontWeight: 800 }}>{co2eSaved} kg</div>
                    <div style={{ fontSize: '10px', opacity: 0.9, fontWeight: 600 }}>CO₂e Saved</div>
                  </div>

                  <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '10px 4px', borderRadius: '10px' }}>
                    <div style={{ fontSize: '19px', fontWeight: 800 }}>{waterSaved} L</div>
                    <div style={{ fontSize: '10px', opacity: 0.9, fontWeight: 600 }}>Water Saved</div>
                  </div>
                </div>
              </div>

              {/* Card 5: Food Freshness & Handling Quality Tags */}
              <div className="card" style={{
                borderRadius: 'var(--radius-xl)',
                padding: '16px',
                marginBottom: 'var(--space-4)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xs)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                    Freshness & Safety Handling Tags
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Select all that apply</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  {QUALITY_TAGS.map((tag) => {
                    const active = selectedQualityTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleQualityTag(tag.id)}
                        style={{
                          padding: '8px 12px',
                          borderRadius: '9999px',
                          border: active ? '1.5px solid #0d9668' : '1px solid #cbd5e1',
                          background: active ? '#f0fdf4' : '#ffffff',
                          color: active ? '#0d9668' : '#475569',
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          minHeight: '38px',
                        }}
                      >
                        
                        <span>{tag.label}</span>
                        {active && <span style={{ color: '#0d9668', fontWeight: 800 }}>OK</span>}
                      </button>
                    );
                  })}
                </div>

                {/* Preparation Time 1-Tap Presets */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label className="form-label" htmlFor="prep-time-input" style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>
                      Cooked / Prepared Time
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handlePrepTimeOffset(0)}
                        style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        Just now
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrepTimeOffset(2)}
                        style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        2h ago
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePrepTimeOffset(4)}
                        style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        4h ago
                      </button>
                    </div>
                  </div>

                  <input
                    id="prep-time-input"
                    name="preparedAt"
                    type="datetime-local"
                    className="form-input"
                    value={form.preparedAt}
                    onChange={handleChange}
                    style={{ minHeight: '48px', fontSize: '14px', borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* Step 1 Continue Action (Mobile only) */}
              <div className="donor-create-step1-continue" style={{ marginTop: 'var(--space-4)', marginBottom: '80px' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    setActiveStep(2);
                    window.scrollTo({ top: 120, behavior: 'smooth' });
                  }}
                  disabled={!isStep1Valid}
                  style={{
                    width: '100%',
                    minHeight: '52px',
                    fontSize: '16px',
                    fontWeight: 800,
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: '0 6px 18px rgba(13, 150, 104, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span>Continue to Pickup Location &rarr;</span>
                </button>
              </div>
            </div>

            {/* ============================================================
                PANEL 2: PICKUP COORDINATION & INTERACTIVE GPS DISPATCH
                ============================================================ */}
            <div ref={formSectionRef} className={`donor-create-panel ${activeStep === 2 ? '' : 'hide-mobile'}`} style={{ animation: 'fadeIn 0.25s ease' }}>
              <div className="donor-create-right-sticky">
                {/* Card 1: GPS Auto-Detect & Landmark Quick Carousel */}
                <div className="card" style={{
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px',
                  marginBottom: 'var(--space-4)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                        Pickup GPS Geolocation
                      </h3>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                        Used by volunteers for turn-by-turn navigation in Trichy
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => openInGoogleMaps(getGoogleMapsNavigationUrl(form.pickupLat, form.pickupLng, form.pickupAddress))}
                      style={{
                        padding: '4px 10px',
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0284c7',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <span>Google Maps</span>
                      <span>&rarr;</span>
                    </button>
                  </div>

                  {/* 1-Tap "Detect My Current Location" Hero Button */}
                  <div style={{ marginBottom: '14px' }}>
                    <button
                      type="button"
                      onClick={handleAutoDetectLocation}
                      disabled={gpsDetecting}
                      style={{
                        width: '100%',
                        minHeight: '50px',
                        borderRadius: '14px',
                        border: 'none',
                        background: gpsDetecting
                          ? '#cbd5e1'
                          : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: gpsDetecting ? 'wait' : 'pointer',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                      }}
                    >
                      
                      <span>{gpsDetecting ? 'Acquiring GPS Fix...' : 'Detect My Exact Location (1-Tap GPS)'}</span>
                    </button>

                    {gpsFeedback && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: gpsFeedback.includes('locked') ? '#0d9668' : '#64748b',
                        textAlign: 'center',
                      }}>
                        {gpsFeedback}
                      </div>
                    )}
                  </div>

                  {/* Horizontal Scrollable Trichy Landmark Chips Carousel */}
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Swipeable Trichy Food Hubs:
                    </span>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    WebkitOverflowScrolling: 'touch',
                  }}>
                    {QUICK_TRICHY_HUBS.map((hub) => {
                      const isSelected = Math.abs(form.pickupLat - hub.lat) < 0.002 && Math.abs(form.pickupLng - hub.lng) < 0.002;
                      return (
                        <button
                          key={hub.name}
                          type="button"
                          onClick={() => handleLocationSelect({ lat: hub.lat, lng: hub.lng, address: `${hub.name}, ${hub.addr}` })}
                          style={{
                            padding: '8px 12px',
                            borderRadius: '12px',
                            border: isSelected ? '2px solid #0d9668' : '1px solid #cbd5e1',
                            background: isSelected ? '#f0fdf4' : '#ffffff',
                            color: isSelected ? '#0d9668' : '#1e293b',
                            fontSize: '12px',
                            fontWeight: 700,
                            whiteSpace: 'nowrap',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0,
                            minHeight: '40px',
                          }}
                        >
                          
                          <span>{hub.name.split(',')[0]}</span>
                          {isSelected && <span style={{ color: '#0d9668', fontWeight: 800 }}>OK</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card 2: Interactive OpenStreetMap Map View */}
                <div className="card" style={{
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px',
                  marginBottom: 'var(--space-4)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-xs)',
                  overflow: 'hidden',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 800, fontSize: '13px' }}>
                      Interactive Map Pin (Tap map to reposition)
                    </label>
                    <span className="badge badge-secondary" style={{ fontSize: '10px' }}>
                      {Number(form.pickupLat).toFixed(4)}, {Number(form.pickupLng).toFixed(4)}
                    </span>
                  </div>

                  <MapView
                    height="280px"
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

                {/* Card 3: Address & Gate Instructions */}
                <div className="card" style={{
                  borderRadius: 'var(--radius-xl)',
                  padding: '16px',
                  marginBottom: 'var(--space-4)',
                  border: '1px solid var(--color-border)',
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" htmlFor="pickup-address-input" style={{ fontWeight: 800, fontSize: '13px' }}>
                      Pickup Address & Landmark *
                    </label>
                    <input
                      id="pickup-address-input"
                      name="pickupAddress"
                      className="form-input"
                      value={form.pickupAddress}
                      onChange={handleChange}
                      placeholder="e.g. Hotel Sangam Back Gate, Cantonment, Trichy"
                      required
                      style={{ minHeight: '48px', fontSize: '14px', borderRadius: '10px' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" htmlFor="pickup-desc-input" style={{ fontWeight: 800, fontSize: '13px' }}>
                      Courier Dispatch Notes (Gate, Parking, Contact)
                    </label>
                    <textarea
                      id="pickup-desc-input"
                      name="description"
                      className="form-textarea"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="e.g. Report to Banquet Kitchen Manager, entry through Gate 2..."
                      style={{ minHeight: '80px', fontSize: '13px', borderRadius: '10px' }}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label className="form-label" htmlFor="pickup-packaging-input" style={{ fontWeight: 700, fontSize: '12px' }}>
                        Packaging Container
                      </label>
                      <input
                        id="pickup-packaging-input"
                        name="packagingType"
                        className="form-input"
                        value={form.packagingType}
                        onChange={handleChange}
                        placeholder="e.g. Steel Vessels, Chafing Dishes"
                        style={{ minHeight: '42px', fontSize: '13px', borderRadius: '8px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Dispatch Summary Card */}
                <div style={{
                  padding: '14px',
                  background: 'var(--color-primary-bg)',
                  borderRadius: 'var(--radius-xl)',
                  fontSize: '12px',
                  color: 'var(--color-primary-dark)',
                  border: '1px solid var(--color-primary-light)',
                  marginBottom: '90px',
                }}>
                  <div style={{ fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>Automated AI Dispatch Sequence</span>
                  </div>
                  <div>
                    Upon submission, our AI matching engine evaluates distance, capacity, and perishability to alert the nearest Trichy volunteer courier and recipient shelter.
                  </div>
                </div>

                {/* Desktop High-Impact Dispatch Action Button */}
                <div className="donor-create-desktop-submit" style={{ marginTop: '16px', marginBottom: '24px' }}>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !isStep1Valid || !isStep2Valid}
                    className="btn btn-primary btn-lg"
                    style={{
                      width: '100%',
                      minHeight: '56px',
                      fontSize: '16px',
                      fontWeight: 800,
                      borderRadius: '14px',
                      boxShadow: '0 8px 24px rgba(13, 150, 104, 0.35)',
                      cursor: (loading || !isStep1Valid || !isStep2Valid) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                    }}
                  >
                    
                    <span>{loading ? 'Dispatching Food Mission...' : `Dispatch ${quantityNum || 0} kg Surplus Food`}</span>
                  </button>
                  {(!isStep1Valid || !isStep2Valid) && (
                    <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center', marginTop: '6px', fontWeight: 600 }}>
                      {!isStep1Valid ? 'Please enter food item name & confirmed weight' : 'Please provide pickup address'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              STICKY MOBILE BOTTOM ACTION BAR
              Provides thumb-accessible submit CTA and dynamic live summary
              ============================================================ */}
          <div className="donor-create-sticky-bottom" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: '1px solid #cbd5e1',
            padding: '12px 16px',
            paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
            boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            {/* Live Summary Capsule */}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: '110px' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                Total Surplus
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                {quantityNum > 0 ? `${quantityNum} kg` : '0 kg'}
                <span style={{ fontSize: '11px', color: '#0d9668', marginLeft: '4px', fontWeight: 700 }}>
                  (~{estimatedMeals} m)
                </span>
              </div>
            </div>

            {/* Step Action Button */}
            {activeStep === 1 ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setActiveStep(2);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
                disabled={!isStep1Valid}
                style={{
                  flex: 1,
                  minHeight: '48px',
                  fontSize: '15px',
                  fontWeight: 800,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(13, 150, 104, 0.25)',
                }}
              >
                <span>Pickup Details &rarr;</span>
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveStep(1)}
                  style={{
                    minHeight: '48px',
                    padding: '0 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    borderRadius: '12px',
                  }}
                >
                  Back
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={loading || !isStep2Valid}
                  style={{
                    flex: 1,
                    minHeight: '48px',
                    fontSize: '15px',
                    fontWeight: 800,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'linear-gradient(135deg, #0d9668 0%, #059669 100%)',
                    boxShadow: '0 4px 14px rgba(13, 150, 104, 0.35)',
                  }}
                >
                  {loading ? (
                    <span>Dispatching...</span>
                  ) : (
                    <>
                      <span>Dispatch Now</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Live AR Camera Reticle Scanner Modal */}
      <LiveArFoodScannerModal
        isOpen={arScannerOpen}
        onClose={() => setArScannerOpen(false)}
        onEstimateCaptured={handleConfirmAiEstimate}
      />
    </DashboardLayout>
  );
}
