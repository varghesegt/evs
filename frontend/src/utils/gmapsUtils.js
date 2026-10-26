/**
 * Google Maps Redirection & Navigation Utilities
 * Provides deep-linking to the native Google Maps app on Android / iOS and Google Maps Web on Desktop.
 */

/**
 * Universal Turn-by-Turn Navigation URL to a single destination.
 * Automatically opens Google Maps App on mobile devices in navigation mode.
 * @param {number} lat - Destination Latitude
 * @param {number} lng - Destination Longitude
 * @param {string} [label] - Optional destination label or address
 * @returns {string} Google Maps URL
 */
export function getGoogleMapsNavigationUrl(lat, lng, label = '') {
  if (!lat || !lng) return 'https://maps.google.com';
  const cleanLat = Number(lat).toFixed(6);
  const cleanLng = Number(lng).toFixed(6);
  // Universal Google Maps Direction API scheme (launches turn-by-turn in mobile apps)
  return `https://www.google.com/maps/dir/?api=1&destination=${cleanLat},${cleanLng}${label ? `&destination_place_id=${encodeURIComponent(label)}` : ''}`;
}

/**
 * Universal Multi-Stop Itinerary Navigation URL.
 * Passes Origin, Intermediate Pickup Waypoints, and Recipient Shelter Destination to Google Maps.
 * @param {{lat: number, lng: number}} origin - Courier starting position
 * @param {{lat: number, lng: number}} destination - Final drop-off shelter position
 * @param {Array<{lat: number, lng: number}>} [waypoints] - Intermediate pickup points
 * @returns {string} Google Maps Multi-Stop URL
 */
export function getGoogleMapsMultiStopRouteUrl(origin, destination, waypoints = []) {
  if (!destination || !destination.lat || !destination.lng) return 'https://maps.google.com';
  
  const destStr = `${Number(destination.lat).toFixed(6)},${Number(destination.lng).toFixed(6)}`;
  let url = `https://www.google.com/maps/dir/?api=1&destination=${destStr}`;
  
  if (origin && origin.lat && origin.lng) {
    url += `&origin=${Number(origin.lat).toFixed(6)},${Number(origin.lng).toFixed(6)}`;
  }
  
  if (waypoints && waypoints.length > 0) {
    const validWps = waypoints.filter(wp => wp && wp.lat && wp.lng);
    if (validWps.length > 0) {
      const wpParam = validWps.map(wp => `${Number(wp.lat).toFixed(6)},${Number(wp.lng).toFixed(6)}`).join('|');
      url += `&waypoints=${encodeURIComponent(wpParam)}`;
    }
  }
  
  return url;
}

/**
 * Search or pin-point view on Google Maps.
 * @param {number} lat 
 * @param {number} lng 
 * @returns {string}
 */
export function getGoogleMapsSearchUrl(lat, lng) {
  if (!lat || !lng) return 'https://maps.google.com';
  return `https://www.google.com/maps/search/?api=1&query=${Number(lat).toFixed(6)},${Number(lng).toFixed(6)}`;
}

/**
 * Opens a Google Maps URL safely in a new tab or triggers the native application intent.
 * @param {string} url 
 */
export function openInGoogleMaps(url) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Key Geographic Landmarks & Food Recovery Hubs in Tiruchirappalli (Trichy)
 */
export const TRICHY_LANDMARKS = [
  { name: 'Cantonment', lat: 10.8030, lng: 78.6850, desc: 'Central Commercial & Hotel Zone' },
  { name: 'Thillai Nagar', lat: 10.8280, lng: 78.6860, desc: 'Dining & Residential Corridor' },
  { name: 'Chathiram Bus Stand', lat: 10.8310, lng: 78.6940, desc: 'Heritage Hub & Akshaya Patra' },
  { name: 'KK Nagar', lat: 10.7760, lng: 78.7050, desc: 'South Residential & Anbalayam Shelter' },
  { name: 'Central Bus Stand', lat: 10.7985, lng: 78.6815, desc: 'Transit Hub & Courier Depot' },
  { name: 'TVS Tollgate', lat: 10.7960, lng: 78.6950, desc: 'SRM Hotel & Cargo Transit' },
  { name: 'NIT Trichy / Thuvakudi', lat: 10.7600, lng: 78.8150, desc: 'Mega Mess & Student Food Banks' },
  { name: 'Srirangam', lat: 10.8620, lng: 78.6920, desc: 'North Temple Zone & Volunteer Hub' },
];

/**
 * Generates an end-to-end formatted WhatsApp dispatch manifest.
 * Contains mission ID, food surplus quantity, perishability window, donor pickup instructions,
 * recipient shelter details, and direct Google Maps app turn-by-turn navigation deep links.
 * 
 * @param {Object} params
 * @param {Object} params.donation - Food donation object
 * @param {Object} [params.volunteer] - Assigned volunteer courier
 * @param {Object} [params.shelter] - Destination recipient shelter
 * @param {string} [params.customNotes] - Optional dispatcher notes
 * @returns {string} Plain text formatted with WhatsApp markdown
 */
export function createWhatsAppDispatchMessage({
  donation,
  volunteer = null,
  shelter = null,
  customNotes = '',
}) {
  if (!donation) return '';

  const missionId = `TRZ-DISP-${donation.id || Math.floor(100 + Math.random() * 900)}`;
  const foodName = donation.foodName || 'Cooked Surplus Food';
  const quantity = donation.quantityKg || '25';
  const category = (donation.foodCategory || 'COOKED_MEALS').replace(/_/g, ' ');
  const freshness = donation.freshnessHoursRemaining || 4;
  const isUrgent = freshness <= 2.5;

  const pickupLat = donation.pickupLat || 10.8030;
  const pickupLng = donation.pickupLng || 78.6850;
  const pickupAddress = donation.pickupAddress || 'McDonalds Road, Cantonment, Trichy';
  const donorName = donation.donor?.name || donation.donorName || 'Corporate Donor';
  const donorPhone = donation.donor?.phone || '9443100001';
  const pickupGmapsUrl = getGoogleMapsNavigationUrl(pickupLat, pickupLng, `${donorName} - ${pickupAddress}`);

  const shelterName = shelter?.name || 'Akshaya Patra Distribution Shelter';
  const shelterAddress = shelter?.address || 'Chathiram Bus Stand Corridor, Trichy';
  const shelterPhone = shelter?.phone || '9443100010';
  const shelterLat = shelter?.lat || 10.8310;
  const shelterLng = shelter?.lng || 78.6940;
  const shelterGmapsUrl = getGoogleMapsNavigationUrl(shelterLat, shelterLng, `${shelterName} - ${shelterAddress}`);

  const originCoords = volunteer?.latitude ? { lat: volunteer.latitude, lng: volunteer.longitude } : { lat: pickupLat, lng: pickupLng };
  const destCoords = { lat: shelterLat, lng: shelterLng };
  const fullRouteUrl = getGoogleMapsMultiStopRouteUrl(originCoords, destCoords, [{ lat: pickupLat, lng: pickupLng }]);

  let msg = `🚨 *ECOSHARE AI - FOOD RESCUE MISSION* 🚨\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📦 *Mission:* #${missionId}\n`;
  msg += `🍲 *Batch:* ${foodName} (${quantity} kg • ${category})\n`;
  msg += `⏳ *Shelf-Life Window:* ${freshness} Hours Remaining ${isUrgent ? '⚠️ [CODE RED SURGE]' : ''}\n`;
  if (volunteer?.name) {
    msg += `🚴 *Assigned Courier:* ${volunteer.name} (${volunteer.phone || '9443100030'})\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📍 *STEP 1: PICKUP (Donor)*\n`;
  msg += `• Facility: ${donorName}\n`;
  msg += `• Address: ${pickupAddress}\n`;
  msg += `• Contact: 📞 ${donorPhone}\n`;
  msg += `🧭 *Turn-by-Turn to Donor (Google Maps):*\n${pickupGmapsUrl}\n\n`;
  msg += `🏁 *STEP 2: DROP-OFF (Shelter)*\n`;
  msg += `• Recipient: ${shelterName}\n`;
  msg += `• Address: ${shelterAddress}\n`;
  msg += `• Contact: 📞 ${shelterPhone}\n`;
  msg += `🧭 *Turn-by-Turn to Shelter (Google Maps):*\n${shelterGmapsUrl}\n\n`;
  msg += `🗺️ *COMPLETE MULTI-STOP ROUTE (Courier -> Donor -> Shelter):*\n${fullRouteUrl}\n`;
  if (customNotes) {
    msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `📝 *Notes:* ${customNotes}\n`;
  }
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*Tap any link to start turn-by-turn navigation in the Google Maps App.*`;

  return msg;
}

/**
 * Launches WhatsApp with pre-filled message text.
 * @param {string} [phone] - Optional recipient phone (e.g. "9443100001")
 * @param {string} messageText - Pre-formatted dispatch message
 */
export function openWhatsAppDispatch(phone = '', messageText = '') {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  let url = `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;
  if (cleanPhone) {
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    url += `&phone=${fullPhone}`;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

