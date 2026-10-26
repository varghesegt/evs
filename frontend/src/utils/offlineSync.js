// EcoShare Offline Synchronization & Cache Engine
// Enables full offline functionality: PWA offline caching, mock fallback, and offline outbox sync.

const SYNC_QUEUE_KEY = 'ecoshare_sync_queue';
const CACHE_PREFIX = 'ecoshare_cache_';

// Rich fallback datasets for Trichy ecosystem when running fully offline
export const OFFLINE_SEED_DATA = {
  '/analytics/map-pins': [
    { id: 1, type: 'donor', title: 'SRM Hotel & Convention Centre', subtitle: '45 kg Cooked Rice & Curry • High Freshness', lat: 10.7905, lng: 78.7047, phone: '+91 94431 12345' },
    { id: 2, type: 'donor', title: 'Hotel Sangam Trichy', subtitle: '30 kg Feast Curry & Roti', lat: 10.8050, lng: 78.6850, phone: '+91 94431 23456' },
    { id: 3, type: 'ngo', title: 'Trichy Seva Sangam Shelter', subtitle: 'Capacity: 120 Persons • High Urgency', lat: 10.8120, lng: 78.6920, phone: '+91 98424 55678' },
    { id: 4, type: 'ngo', title: 'Anbalayam Children Home', subtitle: 'Capacity: 85 Persons • Verified Shelter', lat: 10.8250, lng: 78.6980, phone: '+91 98424 77890' },
    { id: 5, type: 'volunteer', title: 'Karthik Raja (Volunteer #1)', subtitle: 'EV Bike • 35kg Max • Active', lat: 10.8010, lng: 78.6910, phone: '+91 97890 11223' },
    { id: 6, type: 'volunteer', title: 'Priya Sundaram (Volunteer #2)', subtitle: 'EV Van • 120kg Max • En Route', lat: 10.8150, lng: 78.7100, phone: '+91 97890 44556' },
  ],
  '/donations/my': [
    {
      id: 101,
      foodName: 'South Indian Sambar Rice & Poriyal',
      foodCategory: 'COOKED_RICE',
      quantityKg: 35.0,
      description: 'Fresh banquet food from conference lunch. Temperature held in insulated vessels.',
      status: 'AVAILABLE',
      priorityScore: 92,
      freshnessHoursRemaining: 5.5,
      qrCode: 'ECO-SRM-101-ONLINE',
      pickupAddress: 'SRM Hotel, Near Junction, Trichy',
      pickupLat: 10.7905,
      pickupLng: 78.7047,
      createdAt: new Date().toISOString(),
    },
    {
      id: 102,
      foodName: 'Assorted Bakery Bread & Rolls',
      foodCategory: 'BREAD_BAKERY',
      quantityKg: 18.0,
      description: 'Morning bake surplus, sealed in food-grade kraft bags.',
      status: 'DELIVERED',
      priorityScore: 78,
      freshnessHoursRemaining: 18.0,
      qrCode: 'ECO-SRM-102-ONLINE',
      pickupAddress: 'SRM Convention Hall, Trichy',
      pickupLat: 10.7915,
      pickupLng: 78.7052,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ],
  '/donations/available': [
    {
      id: 101,
      foodName: 'South Indian Sambar Rice & Poriyal',
      foodCategory: 'COOKED_RICE',
      quantityKg: 35.0,
      description: 'Banquet lunch surplus held in insulated containers.',
      status: 'AVAILABLE',
      priorityScore: 92,
      freshnessHoursRemaining: 5.5,
      qrCode: 'ECO-SRM-101',
      pickupAddress: 'SRM Hotel, Trichy',
      pickupLat: 10.7905,
      pickupLng: 78.7047,
      donor: { name: 'SRM Hotel', phone: '+91 94431 12345' }
    }
  ],
  '/volunteer/active': [
    {
      id: 201,
      foodName: 'Steamed Basmati Rice & Dal Makhani',
      foodCategory: 'MIXED_MEAL',
      quantityKg: 40.0,
      description: 'Packed in standard 20L chafing drums.',
      status: 'ASSIGNED',
      priorityScore: 95,
      freshnessHoursRemaining: 4.2,
      pickupAddress: 'Hotel Sangam, Collectorate Road, Trichy',
      pickupLat: 10.8050,
      pickupLng: 78.6850,
      qrCode: 'ECO-VOL-201',
      donor: { name: 'Hotel Sangam Trichy', phone: '+91 94431 23456' },
      ngo: { name: 'Trichy Seva Sangam', address: 'Williams Road, Trichy', phone: '+91 98424 55678' }
    }
  ],
  '/volunteer/pickups': [
    {
      id: 201,
      foodName: 'Steamed Basmati Rice & Dal Makhani',
      quantityKg: 40.0,
      status: 'ASSIGNED',
      pickupAddress: 'Hotel Sangam, Trichy',
      createdAt: new Date().toISOString()
    }
  ],
  '/ngo/donations': [
    {
      id: 101,
      foodName: 'South Indian Sambar Rice & Poriyal',
      quantityKg: 35.0,
      status: 'AVAILABLE',
      priorityScore: 92,
      pickupAddress: 'SRM Hotel, Trichy',
      createdAt: new Date().toISOString()
    }
  ],
  '/ngo/volunteers': [
    { id: 1, name: 'Karthik Raja', phone: '+91 97890 11223', vehicleType: 'EV_BIKE', capacityKg: 35, available: true, lat: 10.8010, lng: 78.6910 },
    { id: 2, name: 'Priya Sundaram', phone: '+91 97890 44556', vehicleType: 'EV_VAN', capacityKg: 120, available: true, lat: 10.8150, lng: 78.7100 },
    { id: 3, name: 'Senthil Kumar', phone: '+91 97890 77889', vehicleType: 'CARGO_AUTO', capacityKg: 80, available: true, lat: 10.7950, lng: 78.6800 },
  ],
  '/analytics/environmental': {
    totalKgDiverted: 1420.5,
    totalCo2eSavedKg: 3551.25,
    mealsProvided: 3550,
    waterSavedLiters: 113640,
    landfillMethaneDivertedKg: 284.1,
  },
  '/analytics/dashboard': {
    totalDonations: 48,
    activeDonations: 6,
    deliveredDonations: 42,
    totalKgRescued: 1420.5,
    activeVolunteers: 12,
    partnerNgos: 8,
  },
  '/analytics/public/summary': {
    totalKgDiverted: 1420.5,
    totalCo2eSavedKg: 3551.25,
    mealsProvided: 3550,
    activeDonors: 15,
    activeNgos: 8,
  }
};

// Check if currently online
export function isAppOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Get cached response or offline seed
export function getCachedEndpoint(endpoint) {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + endpoint);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {
    console.warn('[OfflineCache] Read failed:', e);
  }
  return OFFLINE_SEED_DATA[endpoint] || null;
}

// Save response to offline cache
export function saveCachedEndpoint(endpoint, data) {
  try {
    localStorage.setItem(CACHE_PREFIX + endpoint, JSON.stringify(data));
  } catch (e) {
    console.warn('[OfflineCache] Write failed:', e);
  }
}

// Get pending offline sync queue
export function getSyncQueue() {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Add an action to offline sync queue
export function addToSyncQueue(action) {
  const queue = getSyncQueue();
  queue.push({
    id: 'sync-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
    timestamp: Date.now(),
    ...action,
  });
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('ecoshare_sync_updated', { detail: { count: queue.length } }));
}

// Clear or update sync queue
export function clearSyncQueueItem(itemId) {
  const queue = getSyncQueue().filter(q => q.id !== itemId);
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
  window.dispatchEvent(new CustomEvent('ecoshare_sync_updated', { detail: { count: queue.length } }));
}

// Process sync queue when network restores
export async function processSyncQueue(apiClient) {
  const queue = getSyncQueue();
  if (queue.length === 0) return { processed: 0, failed: 0 };

  let processed = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.type === 'CREATE_DONATION') {
        await apiClient.post('/donations/create', item.payload);
        clearSyncQueueItem(item.id);
        processed++;
      } else if (item.type === 'PICKUP') {
        await apiClient.post(`/volunteer/pickup/${item.donationId}`);
        clearSyncQueueItem(item.id);
        processed++;
      } else if (item.type === 'DELIVER') {
        await apiClient.post(`/volunteer/deliver/${item.donationId}?proofUrl=${encodeURIComponent(item.proofUrl || '')}`);
        clearSyncQueueItem(item.id);
        processed++;
      } else if (item.type === 'ASSIGN_VOLUNTEER') {
        await apiClient.post(`/ngo/assign-volunteer/${item.donationId}?volunteerId=${item.volunteerId}`);
        clearSyncQueueItem(item.id);
        processed++;
      }
    } catch (err) {
      console.warn('[OfflineSync] Failed to process queued action:', item, err);
      failed++;
    }
  }

  window.dispatchEvent(new CustomEvent('ecoshare_sync_completed', { detail: { processed, failed } }));
  return { processed, failed };
}
