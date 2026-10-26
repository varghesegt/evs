// EcoShare Offline Synchronization & Cache Engine
// Enables full offline functionality: PWA offline caching, mock fallback, and offline outbox sync.

const SYNC_QUEUE_KEY = 'ecoshare_sync_queue';
const CACHE_PREFIX = 'ecoshare_cache_';

// Rich fallback datasets for Trichy ecosystem when running on GitHub Pages or fully offline
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
  '/donations/all': [
    {
      id: 101,
      foodName: 'South Indian Sambar Rice & Poriyal',
      quantityKg: 35.0,
      status: 'AVAILABLE',
      priorityScore: 92,
      pickupAddress: 'SRM Hotel, Trichy',
      createdAt: new Date().toISOString()
    },
    {
      id: 102,
      foodName: 'Assorted Bakery Bread & Rolls',
      quantityKg: 18.0,
      status: 'DELIVERED',
      pickupAddress: 'SRM Convention Hall, Trichy',
      createdAt: new Date(Date.now() - 86400000).toISOString()
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
  },
  '/analytics/public/leaderboard': [
    { id: 1, name: 'SRM Hotel & Convention Centre', type: 'HOTEL', totalKgDiverted: 540.0, totalCo2eAvoidedKg: 1350.0, mealsProvided: 1350, rank: 1, badge: 'PLATINUM_RESCUER' },
    { id: 2, name: 'Hotel Sangam Trichy', type: 'HOTEL', totalKgDiverted: 420.0, totalCo2eAvoidedKg: 1050.0, mealsProvided: 1050, rank: 2, badge: 'GOLD_RESCUER' },
    { id: 3, name: 'Geetha Cafe Central', type: 'RESTAURANT', totalKgDiverted: 280.5, totalCo2eAvoidedKg: 701.25, mealsProvided: 700, rank: 3, badge: 'SILVER_RESCUER' },
    { id: 4, name: 'Trichy Catering Guild', type: 'CATERER', totalKgDiverted: 180.0, totalCo2eAvoidedKg: 450.0, mealsProvided: 450, rank: 4, badge: 'BRONZE_RESCUER' },
  ],
  '/admin/users': [
    {
      id: 1,
      name: 'SRM Hotel & Convention Centre',
      organizationName: 'SRM Hotels Pvt Ltd',
      organizationType: 'HOTEL',
      email: 'donor1@ecoshare.com',
      phone: '+91 94431 12345',
      role: 'ROLE_DONOR',
      isActive: true,
      isApproved: true,
      cityZone: 'Cantonment, Trichy',
      createdAt: '2026-09-01T10:00:00',
      lastActive: '2 mins ago',
      kycStatus: 'VERIFIED',
    },
    {
      id: 2,
      name: 'Hotel Sangam Trichy',
      organizationName: 'Sangam Hospitality Group',
      organizationType: 'HOTEL',
      email: 'sangam@ecoshare.com',
      phone: '+91 94431 23456',
      role: 'ROLE_DONOR',
      isActive: true,
      isApproved: true,
      cityZone: 'Collectorate Road, Trichy',
      createdAt: '2026-09-02T11:30:00',
      lastActive: '14 mins ago',
      kycStatus: 'VERIFIED',
    },
    {
      id: 3,
      name: 'Royal Mahal Banquet & Caterers',
      organizationName: 'Royal Catering Services',
      organizationType: 'CATERER',
      email: 'royal@ecoshare.com',
      phone: '+91 94431 99887',
      role: 'ROLE_DONOR',
      isActive: true,
      isApproved: true,
      cityZone: 'Thillai Nagar, Trichy',
      createdAt: '2026-09-10T14:15:00',
      lastActive: '1 hr ago',
      kycStatus: 'VERIFIED',
    },
    {
      id: 4,
      name: 'Trichy Seva Sangam Shelter',
      organizationName: 'Seva Sangam Charitable Trust',
      organizationType: 'SHELTER',
      email: 'ngo1@ecoshare.com',
      phone: '+91 98424 55678',
      role: 'ROLE_NGO',
      isActive: true,
      isApproved: true,
      cityZone: 'Williams Road, Trichy',
      createdAt: '2026-09-02T11:00:00',
      lastActive: '5 mins ago',
      kycStatus: 'VERIFIED',
    },
    {
      id: 5,
      name: 'Anbalayam Children Home',
      organizationName: 'Anbalayam Child Welfare Society',
      organizationType: 'ORPHANAGE',
      email: 'anbalayam@ecoshare.com',
      phone: '+91 98424 77890',
      role: 'ROLE_NGO',
      isActive: true,
      isApproved: true,
      cityZone: 'KK Nagar, Trichy',
      createdAt: '2026-09-04T16:20:00',
      lastActive: '18 mins ago',
      kycStatus: 'VERIFIED',
    },
    {
      id: 6,
      name: 'Blossom Care Community Kitchen',
      organizationName: 'Blossom Relief Foundation',
      organizationType: 'COMMUNITY_KITCHEN',
      email: 'blossom@ecoshare.com',
      phone: '+91 98424 33221',
      role: 'ROLE_NGO',
      isActive: true,
      isApproved: false, // Pending verification for admin approval demo!
      cityZone: 'Ponmalai, Trichy',
      createdAt: '2026-10-15T09:45:00',
      lastActive: 'Just now',
      kycStatus: 'PENDING_AUDIT',
    },
    {
      id: 7,
      name: 'Karthik Raja',
      organizationName: 'EcoShare Rapid EV Fleet',
      organizationType: 'LOGISTICS',
      email: 'vol1@ecoshare.com',
      phone: '+91 97890 11223',
      role: 'ROLE_VOLUNTEER',
      isActive: true,
      isApproved: true,
      cityZone: 'Central Bus Stand, Trichy',
      createdAt: '2026-09-05T09:30:00',
      lastActive: 'Live GPS Active',
      kycStatus: 'VERIFIED',
    },
    {
      id: 8,
      name: 'Priya Sundaram',
      organizationName: 'EcoShare Cold-Chain Logistics',
      organizationType: 'LOGISTICS',
      email: 'priya@ecoshare.com',
      phone: '+91 97890 44556',
      role: 'ROLE_VOLUNTEER',
      isActive: true,
      isApproved: true,
      cityZone: 'Srirangam Zone, Trichy',
      createdAt: '2026-09-08T10:00:00',
      lastActive: 'Live GPS Active',
      kycStatus: 'VERIFIED',
    },
    {
      id: 9,
      name: 'Senthil Kumar',
      organizationName: 'EcoShare Heavy Cargo Logistics',
      organizationType: 'LOGISTICS',
      email: 'senthil@ecoshare.com',
      phone: '+91 97890 77889',
      role: 'ROLE_VOLUNTEER',
      isActive: false, // Inactive example
      isApproved: true,
      cityZone: 'Palakarai, Trichy',
      createdAt: '2026-09-12T15:20:00',
      lastActive: '2 days ago',
      kycStatus: 'VERIFIED',
    },
    {
      id: 10,
      name: 'EcoShare Trichy Administrator',
      organizationName: 'Trichy Municipal Food Rescue Command',
      organizationType: 'ADMINISTRATION',
      email: 'admin@ecoshare.com',
      phone: '+91 94430 00100',
      role: 'ROLE_ADMIN',
      isActive: true,
      isApproved: true,
      cityZone: 'District Collectorate Office, Trichy',
      createdAt: '2026-08-15T08:00:00',
      lastActive: 'Active Now',
      kycStatus: 'SYSTEM_SUPERADMIN',
    },
  ],
  '/admin/donations': [
    {
      id: 101,
      foodName: 'South Indian Sambar Rice & Poriyal',
      foodCategory: 'COOKED_RICE',
      quantityKg: 35.0,
      priorityScore: 92,
      status: 'AVAILABLE',
      pickupAddress: 'SRM Hotel, Near Central Junction, Trichy',
      donorName: 'SRM Hotel & Convention Centre',
      ngoName: 'Trichy Seva Sangam Shelter',
      volunteerName: 'Awaiting Courier Dispatch',
      createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      freshnessHoursRemaining: 5.5,
      co2eAvoidedKg: 87.5,
      sha256Hash: '0x3a7f9b2c1d8e4f5a6b7c8d9e0f1a2b3c4d5e6f7a',
    },
    {
      id: 102,
      foodName: 'Steamed Basmati Rice & Dal Makhani',
      foodCategory: 'COOKED_RICE',
      quantityKg: 40.0,
      priorityScore: 95,
      status: 'IN_TRANSIT',
      pickupAddress: 'Hotel Sangam, Collectorate Road, Trichy',
      donorName: 'Hotel Sangam Trichy',
      ngoName: 'Trichy Seva Sangam Shelter',
      volunteerName: 'Karthik Raja (EV Bike)',
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      freshnessHoursRemaining: 4.2,
      co2eAvoidedKg: 108.0,
      sha256Hash: '0x4b8e1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b',
    },
    {
      id: 103,
      foodName: 'Assorted Bakery Bread, Buns & Rolls',
      foodCategory: 'BREAD_BAKERY',
      quantityKg: 18.0,
      priorityScore: 78,
      status: 'DELIVERED',
      pickupAddress: 'SRM Convention Hall, Trichy',
      donorName: 'SRM Hotel & Convention Centre',
      ngoName: 'Anbalayam Children Home',
      volunteerName: 'Priya Sundaram (EV Van)',
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      freshnessHoursRemaining: 18.0,
      co2eAvoidedKg: 21.6,
      sha256Hash: '0x5c9f2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
    },
    {
      id: 104,
      foodName: 'Vegetable Biryani with Brinjal Gravy',
      foodCategory: 'COOKED_RICE',
      quantityKg: 50.0,
      priorityScore: 94,
      status: 'ASSIGNED',
      pickupAddress: 'Royal Mahal, Thillai Nagar, Trichy',
      donorName: 'Royal Mahal Banquet',
      ngoName: 'Anbalayam Children Home',
      volunteerName: 'Karthik Raja (EV Bike)',
      createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      freshnessHoursRemaining: 4.8,
      co2eAvoidedKg: 135.0,
      sha256Hash: '0x6d0a3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d',
    },
    {
      id: 105,
      foodName: 'Paneer Butter Masala & Rotis',
      foodCategory: 'COOKED_CURRY',
      quantityKg: 25.0,
      priorityScore: 89,
      status: 'DELIVERED',
      pickupAddress: 'Hotel Sangam, Trichy',
      donorName: 'Hotel Sangam Trichy',
      ngoName: 'Trichy Seva Sangam Shelter',
      volunteerName: 'Priya Sundaram (EV Van)',
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      freshnessHoursRemaining: 8.0,
      co2eAvoidedKg: 55.0,
      sha256Hash: '0x7e1b4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e',
    },
    {
      id: 106,
      foodName: 'Fresh Cut Mixed Melons & Papaya',
      foodCategory: 'FRUITS',
      quantityKg: 20.0,
      priorityScore: 85,
      status: 'DELIVERED',
      pickupAddress: 'SRM Hotel Banquet Kitchen, Trichy',
      donorName: 'SRM Hotel & Convention Centre',
      ngoName: 'Anbalayam Children Home',
      volunteerName: 'Karthik Raja (EV Bike)',
      createdAt: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
      freshnessHoursRemaining: 12.0,
      co2eAvoidedKg: 12.0,
      sha256Hash: '0x8f2c5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f',
    },
    {
      id: 107,
      foodName: 'Breakfast Idli, Vada & Coconut Chutney',
      foodCategory: 'COOKED_RICE',
      quantityKg: 22.0,
      priorityScore: 91,
      status: 'DELIVERED',
      pickupAddress: 'Royal Mahal, Trichy',
      donorName: 'Royal Mahal Banquet',
      ngoName: 'Trichy Seva Sangam Shelter',
      volunteerName: 'Priya Sundaram (EV Van)',
      createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
      freshnessHoursRemaining: 6.0,
      co2eAvoidedKg: 59.4,
      sha256Hash: '0x9a3d6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a',
    },
  ],
  '/ai/surge-status': {
    activeSurgeAlert: false,
    surgeLevel: 'NORMAL',
    elevatedCount: 0,
    criticalBatches: [],
    systemStatus: 'ONLINE',
    lastScanTimestamp: new Date().toISOString(),
  },
  '/ai/accuracy-stats': {
    totalEstimations: 148,
    meanAbsoluteErrorPct: 6.2,
    confidenceScoreAvg: 94.8,
    visionModelVersion: 'YOLOv8-FoodResNet-Trichy-v2.1',
    sensorIntegrationsActive: ['BLE_CORE_PROBE', 'WEIGHT_CELL_LID'],
  },
  '/ai/demand-forecast': {
    forecastRegion: 'Tiruchirappalli Metro',
    forecastPeriod: 'Next 24 Hours',
    totalForecastedMealsDeficit: 320,
    totalExpectedSurplusMeals: 485,
    deficitCoveragePercentage: 151,
    shelterPredictions: [
      { ngoId: 4, ngoName: 'Trichy Seva Sangam Shelter', estimatedMealsNeeded: 140, foodNeededKg: 56.0, peakDeficitTime: '7:30 PM - 9:00 PM', urgencyLevel: 'ELEVATED' },
      { ngoId: 5, ngoName: 'Anbalayam Children Home', estimatedMealsNeeded: 95, foodNeededKg: 38.0, peakDeficitTime: '12:30 PM - 2:00 PM', urgencyLevel: 'MODERATE' },
      { ngoId: 6, ngoName: 'Blossom Care Community Kitchen', estimatedMealsNeeded: 85, foodNeededKg: 34.0, peakDeficitTime: '8:00 PM - 9:30 PM', urgencyLevel: 'MODERATE' }
    ],
    aiRecommendation: 'Sufficient banquet surplus projected from Cantonment hotels. Prioritize evening cooked rice dispatch to Seva Sangam.'
  },
};

// Check if currently online
export function isAppOnline() {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Get cached response or offline seed
export function getCachedEndpoint(endpoint) {
  if (!endpoint) return null;
  try {
    const cleanUrl = endpoint.split('?')[0];
    const cached = localStorage.getItem(CACHE_PREFIX + cleanUrl) || localStorage.getItem(CACHE_PREFIX + endpoint);
    if (cached) {
      return JSON.parse(cached);
    }
    if (OFFLINE_SEED_DATA[cleanUrl]) {
      return OFFLINE_SEED_DATA[cleanUrl];
    }
    if (OFFLINE_SEED_DATA[endpoint]) {
      return OFFLINE_SEED_DATA[endpoint];
    }
    if (cleanUrl.startsWith('/analytics/certificate/')) {
      return {
        certificateId: 'EVS-TRICHY-CERT-2026',
        donorName: 'SRM Hotel & Convention Centre',
        co2eAvoidedKg: 1350.0,
        mealsRescued: 1350,
        waterSavedLiters: 43200,
        issuedDate: new Date().toLocaleDateString(),
        signatureHash: '0x8f7b3a9c1e2d4f5a6b7c8d9e0f1a2b3c',
        status: 'VERIFIED'
      };
    }
    if (cleanUrl.startsWith('/donations/')) {
      return OFFLINE_SEED_DATA['/donations/my'][0];
    }
  } catch (e) {
    console.warn('[OfflineCache] Read failed:', e);
  }
  return null;
}

// Save response to offline cache
export function saveCachedEndpoint(endpoint, data) {
  try {
    const cleanUrl = endpoint.split('?')[0];
    localStorage.setItem(CACHE_PREFIX + cleanUrl, JSON.stringify(data));
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
