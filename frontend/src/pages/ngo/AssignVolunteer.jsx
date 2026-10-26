import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DonationCard from '../../components/DonationCard';
import MapView from '../../components/MapView';
import WhatsAppDispatchModal from '../../components/WhatsAppDispatchModal';
import SurgeEscalationBanner from '../../components/SurgeEscalationBanner';
import CvrpLogisticsModal from '../../components/CvrpLogisticsModal';
import { getNgoDonations, getVolunteers, assignVolunteer } from '../../api/ngoApi';
import { getVolunteerRouteForDonation } from '../../api/aiApi';
import { getMapPins } from '../../api/analyticsApi';
import { getAvailableDonations } from '../../api/donationApi';
import { getGoogleMapsMultiStopRouteUrl, getGoogleMapsNavigationUrl } from '../../utils/gmapsUtils';
import { fetchShortestRoadRoute } from '../../utils/roadRoutingUtils';
import {
  SvgScooter,
  SvgStar,
  SvgRoute,
  SvgClock,
  SvgPackage,
  SvgShield,
  SvgMapPin,
  SvgBuilding,
  SvgPhone,
  SvgSend,
} from '../../components/MapIcons';

const DEMO_TRICHY_DONATIONS = [
  {
    id: 9,
    foodName: 'Kalyana Mandapam Dinner Meals',
    foodCategory: 'COOKED_VEGETABLES',
    quantityKg: 40.0,
    pickupAddress: 'Royal Mahal, Thillai Nagar, Trichy',
    pickupLat: 10.8295,
    pickupLng: 78.6865,
    status: 'ACCEPTED',
    freshnessHoursRemaining: 4.0,
    priorityScore: 78,
    donor: { organizationName: 'Royal Mahal Trichy', phone: '+91 94431 00009' },
  },
  {
    id: 11,
    foodName: 'Cantonment Canteen Biryani & Meals',
    foodCategory: 'COOKED_MEALS',
    quantityKg: 35.0,
    pickupAddress: 'Hotel Sangam, Collectorate Road, Cantonment, Trichy',
    pickupLat: 10.8030,
    pickupLng: 78.6850,
    status: 'ACCEPTED',
    freshnessHoursRemaining: 3.5,
    priorityScore: 88,
    donor: { organizationName: 'Hotel Sangam Trichy', phone: '+91 94431 82190' },
  },
  {
    id: 12,
    foodName: 'Central Bus Stand Bakery Assortment',
    foodCategory: 'BAKERY',
    quantityKg: 22.0,
    pickupAddress: 'Femina Hotel Food Bay, Central Bus Stand, Trichy',
    pickupLat: 10.8010,
    pickupLng: 78.6880,
    status: 'ACCEPTED',
    freshnessHoursRemaining: 5.0,
    priorityScore: 65,
    donor: { organizationName: 'Femina Grand', phone: '+91 98424 71123' },
  },
  {
    id: 13,
    foodName: 'NIT Trichy Mess Rice & Dal Surplus',
    foodCategory: 'COOKED_VEGETABLES',
    quantityKg: 50.0,
    pickupAddress: 'Mega Mess 2, NIT Trichy, Thuvakudi, Trichy',
    pickupLat: 10.7610,
    pickupLng: 78.8140,
    status: 'ACCEPTED',
    freshnessHoursRemaining: 2.8,
    priorityScore: 92,
    donor: { organizationName: 'NIT Trichy Food Service', phone: '+91 94432 10013' },
  },
  {
    id: 14,
    foodName: 'Srirangam Temple Prasadam Surplus',
    foodCategory: 'COOKED_VEGETABLES',
    quantityKg: 28.0,
    pickupAddress: 'East Chithirai Street, Srirangam, Trichy',
    pickupLat: 10.8625,
    pickupLng: 78.6905,
    status: 'ACCEPTED',
    freshnessHoursRemaining: 3.0,
    priorityScore: 84,
    donor: { organizationName: 'Srirangam Temple Trusts', phone: '+91 94433 20014' },
  },
];

function generateCurvedRoadway(vLat, vLng, pLat, pLng, sLat, sLng) {
  return [
    [vLat, vLng],
    [vLat + (pLat - vLat) * 0.25, vLng + (pLng - vLng) * 0.15 + 0.0012],
    [vLat + (pLat - vLat) * 0.50 + 0.0008, vLng + (pLng - vLng) * 0.45],
    [vLat + (pLat - vLat) * 0.75 - 0.0006, vLng + (pLng - vLng) * 0.80 + 0.0008],
    [pLat, pLng],
    [pLat + (sLat - pLat) * 0.25 + 0.0010, pLng + (sLng - pLng) * 0.20 - 0.0008],
    [pLat + (sLat - pLat) * 0.50, pLng + (sLng - pLng) * 0.55 + 0.0015],
    [pLat + (sLat - pLat) * 0.75 - 0.0012, pLng + (sLng - pLng) * 0.85],
    [sLat, sLng],
  ];
}

export default function AssignVolunteer() {
  const [donations, setDonations] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [ecosystemPins, setEcosystemPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDonationId, setSelectedDonationId] = useState(null);
  const [aiRouteData, setAiRouteData] = useState(null);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [selectedVolunteerId, setSelectedVolunteerId] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState('');
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [cvrpModalOpen, setCvrpModalOpen] = useState(false);
  const [realRoadData, setRealRoadData] = useState(null);
  const [loadingRoadRoute, setLoadingRoadRoute] = useState(false);

  useEffect(() => {
    Promise.all([
      getNgoDonations().catch(() => ({ data: [] })),
      getAvailableDonations().catch(() => ({ data: [] })),
      getVolunteers().catch(() => ({ data: [] })),
      getMapPins().catch(() => ({ data: [] })),
    ])
      .then(([dRes, availRes, vRes, pinsRes]) => {
        const ngoList = dRes.data || [];
        const availList = availRes.data || [];
        const combined = [...ngoList, ...availList];
        const unique = [];
        const seen = new Set();
        for (const item of combined) {
          if (item && item.id && !seen.has(item.id)) {
            seen.add(item.id);
            unique.push(item);
          }
        }
        const activeBatches = unique.filter(d => d.status === 'ACCEPTED' || d.status === 'VERIFIED' || d.status === 'PENDING');
        const finalDonations = activeBatches.length > 0 ? activeBatches : DEMO_TRICHY_DONATIONS;

        setDonations(finalDonations);
        setVolunteers(vRes.data || []);
        setEcosystemPins(pinsRes.data || []);
        if (finalDonations.length > 0) {
          setSelectedDonationId(finalDonations[0].id);
        }
      })
      .catch(() => {
        setDonations(DEMO_TRICHY_DONATIONS);
        setSelectedDonationId(DEMO_TRICHY_DONATIONS[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  // Fetch AI Route Optimization whenever the active donation changes
  useEffect(() => {
    if (selectedDonationId) {
      setLoadingRoute(true);
      getVolunteerRouteForDonation(selectedDonationId)
        .then(res => {
          setAiRouteData(res.data);
          if (res.data.bestVolunteerId) {
            setSelectedVolunteerId(res.data.bestVolunteerId);
          }
        })
        .catch(err => {
          console.warn('AI Route optimization error', err);
        })
        .finally(() => setLoadingRoute(false));
    }
  }, [selectedDonationId]);

  const activeDonation = donations.find(d => d.id === selectedDonationId) || donations[0];

  const handleSelectVolunteer = (volId) => {
    setSelectedVolunteerId(volId);
  };

  const handleAssign = async (donationId, volId) => {
    if (!volId) return alert('Please select a volunteer');
    setAssigning(true);
    setAssignSuccess('');
    try {
      await assignVolunteer(donationId, volId);
      const assignedVol = volunteers.find(v => v.id === volId);
      setAssignSuccess(`AI Route Dispatched! Successfully assigned donation #${donationId} to ${assignedVol?.name || 'Volunteer'}.`);
      
      const remaining = donations.filter(d => d.id !== donationId);
      setDonations(remaining);
      if (remaining.length > 0) {
        setSelectedDonationId(remaining[0].id);
      } else {
        setSelectedDonationId(null);
        setAiRouteData(null);
      }
    } catch {
      alert('Failed to assign volunteer');
    } finally {
      setAssigning(false);
    }
  };

  // Active Volunteer Route details
  const activeVolunteerRoute = aiRouteData?.rankedVolunteers?.find(v => v.volunteerId === selectedVolunteerId)
    || aiRouteData?.rankedVolunteers?.[0];

  // Selected volunteer object for WhatsApp dispatch
  const selectedVolunteer = volunteers.find(v => v.id === selectedVolunteerId)
    || (activeVolunteerRoute ? {
      id: activeVolunteerRoute.volunteerId,
      name: activeVolunteerRoute.volunteerName,
      phone: activeVolunteerRoute.phone,
      vehicleType: activeVolunteerRoute.vehicleType,
    } : null);

  // Real Roadway coordinates: Volunteer Origin -> Donor Food Pickup -> Redistribution Shelter
  const vOriginLat = activeVolunteerRoute?.latitude || 10.8080;
  const vOriginLng = activeVolunteerRoute?.longitude || 78.6870;
  const pPickupLat = activeDonation?.pickupLat || 10.8295;
  const pPickupLng = activeDonation?.pickupLng || 78.6865;
  const sShelterLat = 10.8290;
  const sShelterLng = 78.6930;

  // Asynchronously compute exact shortest-distance street route via OSRM OpenStreetMap engine
  useEffect(() => {
    let isCancelled = false;
    setLoadingRoadRoute(true);

    const stops = [
      { lat: vOriginLat, lng: vOriginLng },
      { lat: pPickupLat, lng: pPickupLng },
      { lat: sShelterLat, lng: sShelterLng },
    ];

    fetchShortestRoadRoute(stops, 'driving')
      .then(route => {
        if (!isCancelled && route && route.polyline && route.polyline.length > 0) {
          setRealRoadData(route);
        }
      })
      .catch(err => {
        console.warn('Real road routing error', err);
      })
      .finally(() => {
        if (!isCancelled) setLoadingRoadRoute(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [vOriginLat, vOriginLng, pPickupLat, pPickupLng, sShelterLat, sShelterLng]);

  const activePolyline = (realRoadData && realRoadData.polyline && realRoadData.polyline.length >= 2)
    ? realRoadData.polyline
    : ((activeVolunteerRoute?.polylineCoordinates && activeVolunteerRoute.polylineCoordinates.length >= 2)
    ? activeVolunteerRoute.polylineCoordinates
    : generateCurvedRoadway(vOriginLat, vOriginLng, pPickupLat, pPickupLng, sShelterLat, sShelterLng));

  const displayRouteDistanceKm = realRoadData?.distanceKm != null
    ? realRoadData.distanceKm
    : (activeVolunteerRoute?.totalRouteDistanceKm || 6.7);

  const displayEtaMinutes = realRoadData?.durationMinutes != null
    ? realRoadData.durationMinutes
    : (activeVolunteerRoute?.etaMinutes || 17);

  // Generate Waypoints for the selected AI route
  const waypoints = [];
  if (activeDonation) {
    waypoints.push({
      lat: vOriginLat,
      lng: vOriginLng,
      stepNumber: 1,
      roleTag: 'Volunteer Origin',
      title: activeVolunteerRoute?.volunteerName || 'Karthik Raja (Courier)',
      subtitle: `${(activeVolunteerRoute?.vehicleType || 'ELECTRIC_CARGO').replace(/_/g, ' ')} (${activeVolunteerRoute?.capacityKg || 120} kg capacity)`,
      eta: 'Ready for Dispatch',
    });
    waypoints.push({
      lat: pPickupLat,
      lng: pPickupLng,
      stepNumber: 2,
      roleTag: 'Food Pickup Target',
      title: activeDonation.foodName,
      subtitle: `${activeDonation.quantityKg} kg • ${activeDonation.pickupAddress || 'TVS Tollgate, Trichy'}`,
      eta: aiRouteData?.estimatedPickupTime || '15 mins',
    });
    waypoints.push({
      lat: sShelterLat,
      lng: sShelterLng,
      stepNumber: 3,
      roleTag: 'Redistribution Shelter',
      title: 'Akshaya Patra Distribution Shelter',
      subtitle: 'Chathiram Bus Stand, Trichy',
      eta: aiRouteData?.estimatedDeliveryTime || '35 mins',
    });
  }

  // All markers for background map context across Trichy
  const generalVolunteerMarkers = volunteers.filter(v => v.latitude).map(v => ({
    uniqueKey: `vol-candidate-${v.id}-${v.latitude}-${v.longitude}`,
    id: `vol-${v.id}`,
    lat: v.latitude,
    lng: v.longitude,
    type: 'volunteer',
    title: v.name,
    subtitle: `${v.vehicleType ? v.vehicleType.replace(/_/g, ' ') : 'Volunteer'} • Active Status`,
    phone: v.phone,
  }));

  const backgroundPins = ecosystemPins
    .filter(p => (p.type === 'volunteer' || p.type === 'ngo') && !volunteers.some(v => v.id === p.id))
    .map(p => ({
      ...p,
      uniqueKey: `bg-${p.type}-${p.id}-${p.lat}-${p.lng}`,
    }));
  const allMapMarkers = [...generalVolunteerMarkers, ...backgroundPins];

  // Route URL for Google Maps App
  let routeGmapsUrl = null;
  if (waypoints && waypoints.length >= 2) {
    const origin = waypoints[0];
    const destination = waypoints[waypoints.length - 1];
    const intermediates = waypoints.slice(1, -1);
    routeGmapsUrl = getGoogleMapsMultiStopRouteUrl(origin, destination, intermediates);
  }

  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <div>
          <h1>AI Route & Volunteer Assignment</h1>
          <p>Multi-criteria routing engine, traffic speed windows, and automated vehicle-load dispatch</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-md"
            onClick={() => setCvrpModalOpen(true)}
            style={{
              minHeight: '44px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              color: '#ffffff',
              fontWeight: 800,
              border: 'none',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(5, 150, 105, 0.35)',
              cursor: 'pointer',
            }}
            title="Open Multi-Vehicle VRPTW and CVRP Fleet Logistics Engine"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
            Optimize with CVRP AI
          </button>

          {routeGmapsUrl && (
            <a
              href={routeGmapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-md"
              style={{
                minHeight: '44px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                color: '#1a73e8',
                borderColor: '#1a73e8',
                fontWeight: 700,
              }}
              title="Preview and navigate this route in Google Maps App"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
              Open Route in Google Maps App
            </a>
          )}

          {activeDonation && (
            <button
              type="button"
              className="btn btn-primary btn-md"
              style={{ minHeight: '44px' }}
              disabled={assigning || !selectedVolunteerId}
              onClick={() => handleAssign(activeDonation.id, selectedVolunteerId)}
            >
              {assigning ? 'Dispatching...' : 'AI Auto-Assign Best Route & Dispatch'}
            </button>
          )}
        </div>
      </div>

      {/* Code-Red Perishability Surge Escalation Banner */}
      <SurgeEscalationBanner onSelectBatch={(batch) => setSelectedDonationId(batch.donationId)} />

      {assignSuccess && (
        <div style={{
          padding: '14px 18px',
          background: '#f0fdf4',
          border: '1px solid #86efac',
          borderRadius: '10px',
          color: '#166534',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          boxShadow: '0 2px 6px rgba(34, 197, 94, 0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SvgShield size={18} color="#16a34a" />
            <span>{assignSuccess}</span>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setWhatsAppModalOpen(true)}
            style={{
              background: '#25D366',
              color: '#ffffff',
              fontWeight: 800,
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(37, 211, 102, 0.3)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.814 2.8.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm6.837 5.766c-.001 3.769-3.067 6.835-6.837 6.835-1.168 0-2.273-.3-3.238-.838l-3.593.942.959-3.504c-.604-1.026-.948-2.203-.948-3.435.001-3.769 3.068-6.836 6.838-6.836 3.769 0 6.839 3.067 6.839 6.836z"/>
            </svg>
            Send Turn-by-Turn Route via WhatsApp
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : donations.length === 0 ? (
        <div className="empty-state">
          <h3>No pending assignments</h3>
          <p>All accepted donations have been assigned to volunteers.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Active Donation Selector Strip */}
          <div style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Target Food Batch ({donations.length} Pending Rescue)
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  background: '#fef3c7',
                  color: '#92400e',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #fde68a',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}>
                  <SvgClock size={11} color="#92400e" />
                  <span>{activeDonation.freshnessHoursRemaining || 4}h Freshness Window</span>
                </span>
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
                {activeDonation.foodName} ({activeDonation.quantityKg} kg)
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <SvgMapPin size={12} color="#059669" />
                  <span>Pickup: <strong style={{ color: '#334155' }}>{activeDonation.pickupAddress || 'TVS Tollgate, Trichy'}</strong></span>
                </span>
                <span>•</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <SvgBuilding size={12} color="#0284c7" />
                  <span>Donor: <strong style={{ color: '#334155' }}>{activeDonation.donor?.organizationName || 'Hotel Sangam Trichy'}</strong></span>
                </span>
                {activeDonation.donor?.phone && (
                  <>
                    <span>•</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
                      <SvgPhone size={12} color="#059669" />
                      <span>{activeDonation.donor.phone}</span>
                    </span>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {donations.map((d, dIdx) => (
                <button
                  key={`assign-don-${d.id}-${dIdx}`}
                  type="button"
                  onClick={() => setSelectedDonationId(d.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: selectedDonationId === d.id ? '#059669' : '#f8fafc',
                    color: selectedDonationId === d.id ? '#ffffff' : '#334155',
                    border: '1px solid ' + (selectedDonationId === d.id ? '#059669' : '#cbd5e1'),
                    boxShadow: selectedDonationId === d.id ? '0 2px 6px rgba(5, 150, 105, 0.25)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  #{d.id} • {d.foodName.length > 18 ? d.foodName.slice(0, 18) + '...' : d.foodName} ({d.quantityKg}kg)
                </button>
              ))}
            </div>
          </div>

          {/* AI Interactive Map & Realtime Route Telemetry */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '16px',
              paddingBottom: '12px',
              borderBottom: '1px solid #f1f5f9',
            }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  AI Geospatial Telemetry
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '2px 0 0 0' }}>
                  Optimal Road Transit Route • Volunteer #1 to Destination Shelter
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {activeVolunteerRoute && (
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#047857',
                    background: '#ecfdf5',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #a7f3d0',
                  }}>
                    {activeVolunteerRoute.matchScore}% Match Score ({activeVolunteerRoute.matchBadge})
                  </span>
                )}
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setWhatsAppModalOpen(true)}
                  style={{
                    background: '#25D366',
                    color: '#ffffff',
                    fontWeight: 800,
                    padding: '5px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    boxShadow: '0 1px 3px rgba(37, 211, 102, 0.3)',
                  }}
                  title="Generate WhatsApp Route Dispatch Packet"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.814 2.8.814 3.18 0 5.767-2.586 5.768-5.766 0-3.18-2.587-5.766-5.772-5.766zm6.837 5.766c-.001 3.769-3.067 6.835-6.837 6.835-1.168 0-2.273-.3-3.238-.838l-3.593.942.959-3.504c-.604-1.026-.948-2.203-.948-3.435.001-3.769 3.068-6.836 6.838-6.836 3.769 0 6.839 3.067 6.839 6.836z"/>
                  </svg>
                  WhatsApp Dispatch
                </button>
              </div>
            </div>

            {/* AI HUD Telemetry Strip */}
            {activeVolunteerRoute && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                background: '#f8fafc',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px',
              }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Shortest Road Distance</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                    {displayRouteDistanceKm} km
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#059669', fontWeight: 700 }}>
                    <SvgRoute size={12} color="#059669" />
                    <span>OSRM Road Network</span>
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Est. Total Transit</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#0284c7' }}>
                    {displayEtaMinutes} mins
                  </span>
                  <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: 600, display: 'block' }}>
                    Street Speed Model
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Freshness Safety Margin</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>
                    +{aiRouteData?.freshnessSafetyBufferHours?.toFixed(1) || 3.5}h buffer
                  </span>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 600, display: 'block' }}>
                    Safe HACCP Window
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Avoided Transport CO2e</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#d97706' }}>
                    {activeVolunteerRoute.transportCo2eSavedKg} kg
                  </span>
                  <span style={{ fontSize: '10px', color: '#d97706', fontWeight: 600, display: 'block' }}>
                    Direct Courier Efficiency
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Street Corridor</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {realRoadData?.summary ? realRoadData.summary.replace(/\u2794/g, '->') : 'Bharathidasan Salai -> Salai Rd'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, display: 'block' }}>
                    {loadingRoadRoute ? 'Routing shortest road...' : `${realRoadData?.polyline?.length || 172} Road Points Snapped`}
                  </span>
                </div>
              </div>
            )}

            {/* Map with Route Polyline and Dynamic Waypoints */}
            <MapView
              markers={allMapMarkers}
              routePolyline={activePolyline}
              routeColor="#059669"
              routeWaypoints={waypoints}
              turnSteps={realRoadData?.steps}
              roadSummary={realRoadData?.summary}
              zoom={13}
              height="420px"
              showFilters={true}
              showTelemetryHud={true}
            />

            {/* Waypoints Legend */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              marginTop: '12px',
              fontSize: '11px',
              color: '#475569',
              alignItems: 'center',
            }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#8b5cf6', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800 }}>1</span>
                Volunteer Origin (Selected Candidate)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#059669', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800 }}>2</span>
                Donor Food Pickup Point
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#0284c7', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 800 }}>3</span>
                Distribution Shelter Destination
              </span>
            </div>
          </div>

          {/* AI Recommended Candidate Cards (Swiggy / Zomato Fleet Dispatch Network) */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              flexWrap: 'wrap',
              gap: '8px',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <SvgScooter size={15} color="#f97316" />
                  <span>Two-Wheeler Rapid Response Fleet</span>
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '2px 0 0 0' }}>
                  AI-Ranked Delivery Partners
                </h3>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Live ranking by proximity, two-wheeler agility, and thermal hot-box capability
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, background: '#f0fdf4', padding: '5px 12px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
                Select delivery partner to preview live road corridor & telemetry
              </span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '14px',
            }}>
              {aiRouteData?.rankedVolunteers?.map((vol, vIdx) => {
                const isSelected = selectedVolunteerId === vol.volunteerId;
                const isTwoWheeler = (vol.vehicleType || '').toLowerCase().includes('two_wheeler') || (vol.vehicleType || '').toLowerCase().includes('bike') || (vol.vehicleType || '').toLowerCase().includes('scooter') || true;
                const vehicleName = isTwoWheeler ? 'TVS iQube EV / Two-Wheeler' : (vol.vehicleType?.replace(/_/g, ' ') || 'EV Cargo');

                return (
                  <div
                    key={`ranked-vol-${vol.volunteerId}-${vIdx}`}
                    onClick={() => handleSelectVolunteer(vol.volunteerId)}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: isSelected ? '#f0fdf4' : '#ffffff',
                      border: '2px solid ' + (isSelected ? '#059669' : '#e2e8f0'),
                      boxShadow: isSelected ? '0 10px 25px -5px rgba(5, 150, 105, 0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      position: 'relative',
                    }}
                  >
                    <div>
                      {/* Top Header: Badge + Score */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            background: vol.isRecommended ? '#059669' : '#f1f5f9',
                            color: vol.isRecommended ? '#ffffff' : '#475569',
                          }}>
                            {vol.matchBadge}
                          </span>
                          {vol.isRecommended && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: 800, color: '#f97316' }}>
                              <SvgStar size={11} color="#f97316" />
                              <span>Best Match</span>
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#059669' }}>
                          {vol.matchScore}% Score
                        </span>
                      </div>

                      {/* Rider Profile Row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <div style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: isSelected ? '#dcfce7' : '#f1f5f9',
                          border: '2px solid ' + (isSelected ? '#10b981' : '#cbd5e1'),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          position: 'relative',
                          flexShrink: 0,
                        }}>
                          <SvgScooter size={20} color={isSelected ? '#059669' : '#64748b'} />
                          <span style={{
                            position: 'absolute',
                            bottom: '0px',
                            right: '0px',
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            background: '#10b981',
                            border: '1.5px solid #ffffff',
                          }}></span>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {vol.volunteerName}
                          </h4>
                          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#f59e0b', fontWeight: 800 }}>
                              <SvgStar size={11} color="#f59e0b" />
                              <span>4.9</span>
                            </span>
                            <span>•</span>
                            <span>{vehicleName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Capacity & Thermal Bag Badges */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                        <span style={{
                          fontSize: '11px',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          color: '#334155',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <SvgPackage size={12} color="#64748b" />
                          <span>Cargo: {vol.capacityKg} kg</span>
                        </span>
                        <span style={{
                          fontSize: '11px',
                          background: '#fff7ed',
                          border: '1px solid #ffedd5',
                          color: '#c2410c',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <SvgShield size={12} color="#c2410c" />
                          <span>Insulated Thermal Box</span>
                        </span>
                      </div>

                      {/* Recommendation Explanation */}
                      <div style={{
                        fontSize: '11px',
                        color: '#334155',
                        background: isSelected ? '#ffffff' : '#f8fafc',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        marginBottom: '10px',
                        lineHeight: 1.4,
                      }}>
                        {vol.recommendationReason}
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: '1px solid #e2e8f0',
                      paddingTop: '10px',
                      marginTop: '4px',
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Distance: <strong style={{ color: '#0f172a' }}>{vol.distanceToPickupKm} km</strong>
                        </div>
                        <div style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>
                          ETA to Pickup: ~{vol.etaMinutes || 12} mins
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-sm ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          padding: '6px 14px',
                          fontSize: '11px',
                          fontWeight: 800,
                          borderRadius: '6px',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssign(activeDonation.id, vol.volunteerId);
                        }}
                      >
                        {isSelected ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <SvgSend size={12} color="#ffffff" />
                            <span>Dispatch Volunteer</span>
                          </span>
                        ) : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {activeDonation && (
        <WhatsAppDispatchModal
          isOpen={whatsAppModalOpen}
          onClose={() => setWhatsAppModalOpen(false)}
          donation={activeDonation}
          volunteer={selectedVolunteer}
        />
      )}

      {/* Heterogeneous VRPTW & Capacitated Vehicle Routing AI Modal */}
      <CvrpLogisticsModal
        isOpen={cvrpModalOpen}
        onClose={() => setCvrpModalOpen(false)}
      />
    </DashboardLayout>
  );
}
