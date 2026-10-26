import axios from 'axios';
import {
  getCachedEndpoint,
  saveCachedEndpoint,
  addToSyncQueue,
  processSyncQueue
} from '../utils/offlineSync';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Demo accounts for instant login anywhere - clean role names only
const OFFLINE_USERS = {
  'donor1@ecoshare.com': { id: 1, name: 'Donor', email: 'donor1@ecoshare.com', role: 'ROLE_DONOR' },
  'donor@ecoshare.com': { id: 1, name: 'Donor', email: 'donor1@ecoshare.com', role: 'ROLE_DONOR' },
  'donor': { id: 1, name: 'Donor', email: 'donor1@ecoshare.com', role: 'ROLE_DONOR' },

  'ngo1@ecoshare.com': { id: 2, name: 'NGO', email: 'ngo1@ecoshare.com', role: 'ROLE_NGO' },
  'ngo@ecoshare.com': { id: 2, name: 'NGO', email: 'ngo1@ecoshare.com', role: 'ROLE_NGO' },
  'ngo': { id: 2, name: 'NGO', email: 'ngo1@ecoshare.com', role: 'ROLE_NGO' },

  'vol1@ecoshare.com': { id: 3, name: 'Volunteer', email: 'vol1@ecoshare.com', role: 'ROLE_VOLUNTEER' },
  'vol@ecoshare.com': { id: 3, name: 'Volunteer', email: 'vol1@ecoshare.com', role: 'ROLE_VOLUNTEER' },
  'volunteer@ecoshare.com': { id: 3, name: 'Volunteer', email: 'vol1@ecoshare.com', role: 'ROLE_VOLUNTEER' },
  'volunteer': { id: 3, name: 'Volunteer', email: 'vol1@ecoshare.com', role: 'ROLE_VOLUNTEER' },

  'admin@ecoshare.com': { id: 4, name: 'Admin', email: 'admin@ecoshare.com', role: 'ROLE_ADMIN' },
  'admin': { id: 4, name: 'Admin', email: 'admin@ecoshare.com', role: 'ROLE_ADMIN' },
};

function extractPayload(data) {
  if (!data) return {};
  if (typeof data === 'object') return data;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  return {};
}

function resolveOfflineUser(payload) {
  const email = (payload.email || '').toLowerCase().trim();
  const explicitRole = payload.role;

  if (OFFLINE_USERS[email]) {
    return OFFLINE_USERS[email];
  }

  if (explicitRole === 'ROLE_ADMIN' || email.includes('admin')) {
    return OFFLINE_USERS['admin@ecoshare.com'];
  }
  if (explicitRole === 'ROLE_NGO' || email.includes('ngo')) {
    return OFFLINE_USERS['ngo1@ecoshare.com'];
  }
  if (explicitRole === 'ROLE_VOLUNTEER' || email.includes('vol')) {
    return OFFLINE_USERS['vol1@ecoshare.com'];
  }
  if (explicitRole === 'ROLE_DONOR' || email.includes('donor')) {
    return OFFLINE_USERS['donor1@ecoshare.com'];
  }

  const role = explicitRole || 'ROLE_DONOR';
  const roleNameMap = {
    ROLE_ADMIN: 'Admin',
    ROLE_DONOR: 'Donor',
    ROLE_NGO: 'NGO',
    ROLE_VOLUNTEER: 'Volunteer',
  };

  return {
    id: 1,
    name: roleNameMap[role] || 'User',
    email: email || 'user@ecoshare.com',
    role,
  };
}

// Check if running on GitHub Pages (where no Spring Boot server exists)
const isStaticHost = typeof window !== 'undefined' && (
  window.location.hostname.endsWith('github.io') ||
  window.location.protocol === 'file:'
);

// Intercept requests: attach token, and on GitHub Pages or offline, intercept cleanly
client.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('ecoshare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;

  // On GitHub Pages or when offline, intercept immediately to prevent browser 404/405 errors
  if (isStaticHost || isOffline) {
    const method = config.method?.toLowerCase() || 'get';

    // 1. GET requests
    if (method === 'get') {
      const cached = getCachedEndpoint(config.url);
      if (cached !== null) {
        config.adapter = () => Promise.resolve({
          data: cached,
          status: 200,
          statusText: 'OK (GitHub Pages / Cache)',
          headers: {},
          config,
        });
        return config;
      }

      // On static hosts (GitHub Pages), resolve immediately so browser never makes a doomed 404 request
      if (isStaticHost) {
        let fallbackData = [];
        if (config.url?.includes('surge')) {
          fallbackData = {
            activeSurgeAlert: false,
            surgeLevel: 'NORMAL',
            elevatedCount: 0,
            criticalBatches: [],
            systemStatus: 'ONLINE',
            lastScanTimestamp: new Date().toISOString()
          };
        } else if (config.url?.includes('forecast')) {
          fallbackData = {
            forecastRegion: 'Tiruchirappalli District',
            forecastPeriod: 'Next 24 Hours',
            totalForecastedMealsDeficit: 320,
            totalExpectedSurplusMeals: 485,
            deficitCoveragePercentage: 151,
            aiRecommendation: 'High surplus availability in Cantonment and Central Bus Stand corridors. Prioritize transfers to Anbalayam Children Home and Trichy Seva Sangam.',
            shelterPredictions: [
              {
                ngoId: 1,
                ngoName: 'Trichy Seva Sangam Shelter',
                shelterName: 'Trichy Seva Sangam Shelter',
                urgencyLevel: 'HIGH',
                riskLevel: 'HIGH',
                estimatedMealsNeeded: 140,
                deficitMeals: 140,
                foodNeededKg: 35.0,
                peakDeficitTime: 'Tonight 19:30 - 21:00',
                recommendedAction: 'Full coverage guaranteed from SRM Hotel surplus.',
              },
              {
                ngoId: 2,
                ngoName: 'Anbalayam Children Home',
                shelterName: 'Anbalayam Children Home',
                urgencyLevel: 'MEDIUM',
                riskLevel: 'MEDIUM',
                estimatedMealsNeeded: 95,
                deficitMeals: 95,
                foodNeededKg: 24.0,
                peakDeficitTime: 'Tomorrow Lunch 12:30 - 14:00',
                recommendedAction: 'Secured via Hotel Sangam banquet dispatch.',
              },
              {
                ngoId: 3,
                ngoName: 'St. Joseph Relief Shelter',
                shelterName: 'St. Joseph Relief Shelter',
                urgencyLevel: 'CRITICAL',
                riskLevel: 'CRITICAL',
                estimatedMealsNeeded: 85,
                deficitMeals: 85,
                foodNeededKg: 21.5,
                peakDeficitTime: 'Tomorrow Breakfast 07:30 - 09:00',
                recommendedAction: 'Dispatch reserve EV courier from Geetha Cafe surplus.',
              },
            ],
          };
        } else if (config.url?.includes('leaderboard')) {
          fallbackData = [
            {
              rank: 1,
              donorId: 1,
              organizationName: 'SRM Hotel & Convention Centre',
              donorName: 'SRM Hotel',
              totalFoodRescuedKg: 540.0,
              totalCo2eAvoidedKg: 1350.0,
              totalWaterSavedKL: 972.0,
              totalMealsSupported: 1350,
              totalDonationsCount: 18,
              tierBadge: 'GREEN_GOLD',
              environmentalBadges: ['Zero-Landfill Defender', 'IPCC Climate Leader', '500+ Meals Hero'],
              verifiedSha256Hash: 'a7c9f64e2d3b4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a',
            },
            {
              rank: 2,
              donorId: 2,
              organizationName: 'Hotel Sangam Trichy',
              donorName: 'Hotel Sangam',
              totalFoodRescuedKg: 420.0,
              totalCo2eAvoidedKg: 1050.0,
              totalWaterSavedKL: 756.0,
              totalMealsSupported: 1050,
              totalDonationsCount: 14,
              tierBadge: 'GREEN_GOLD',
              environmentalBadges: ['Zero-Landfill Defender', 'IPCC Climate Leader', '500+ Meals Hero'],
              verifiedSha256Hash: 'b8d0e75f3e4c5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9b0b',
            },
            {
              rank: 3,
              donorId: 3,
              organizationName: 'Geetha Cafe Central',
              donorName: 'Geetha Cafe',
              totalFoodRescuedKg: 280.5,
              totalCo2eAvoidedKg: 701.3,
              totalWaterSavedKL: 504.9,
              totalMealsSupported: 701,
              totalDonationsCount: 9,
              tierBadge: 'SILVER_SAVIOR',
              environmentalBadges: ['Zero-Landfill Defender', 'IPCC Climate Leader', '500+ Meals Hero'],
              verifiedSha256Hash: 'c9e1f86a4f5d6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9c1c1c',
            },
            {
              rank: 4,
              donorId: 4,
              organizationName: 'Trichy Grand Gardenia',
              donorName: 'Grand Gardenia',
              totalFoodRescuedKg: 115.0,
              totalCo2eAvoidedKg: 287.5,
              totalWaterSavedKL: 207.0,
              totalMealsSupported: 288,
              totalDonationsCount: 4,
              tierBadge: 'SILVER_SAVIOR',
              environmentalBadges: ['Zero-Landfill Defender', 'IPCC Climate Leader'],
              verifiedSha256Hash: 'd0f2a97b5a6e7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9d2d2d2d',
            },
            {
              rank: 5,
              donorId: 5,
              organizationName: 'Sangeetha Restaurant Cantonment',
              donorName: 'Sangeetha Veg',
              totalFoodRescuedKg: 83.0,
              totalCo2eAvoidedKg: 207.5,
              totalWaterSavedKL: 149.4,
              totalMealsSupported: 207,
              totalDonationsCount: 3,
              tierBadge: 'BRONZE_CHAMPION',
              environmentalBadges: ['Zero-Landfill Defender'],
              verifiedSha256Hash: 'e1a3b08c6b7f8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9e3e3e3e3e',
            },
          ];
        } else if (config.url?.includes('accuracy')) {
          fallbackData = { totalEstimations: 148, meanAbsoluteErrorPct: 6.2, confidenceScoreAvg: 94.8 };
        } else if (config.url?.includes('summary') || config.url?.includes('dashboard') || config.url?.includes('environmental')) {
          fallbackData = {
            totalFoodRescuedKg: 1438.5,
            totalKgDiverted: 1438.5,
            totalMealsSupported: 3596,
            mealsProvided: 3596,
            totalCo2eAvoidedKg: 3596.2,
            totalCo2eSavedKg: 3596.2,
            totalWaterSavedLiters: 115080,
            waterSavedLiters: 115080,
            totalFuelSavedLiters: 143.8,
            totalLandfillPreventedKg: 1438.5,
            landfillMethaneDivertedKg: 287.7,
            totalDistanceOptimizedKm: 486.2,
            totalDonations: 48,
            totalActiveDonors: 15,
            totalActiveNgos: 8,
            totalActiveVolunteers: 12,
            pendingDonations: 4,
            completedDeliveries: 42,
            carKmNegated: 14744.4,
            treesPlantedEquivalency: 163.5,
            electricityHoursSaved: 43154.4,
            cookedRiceCo2e: 1618.3,
            cookedCurryCo2e: 899.1,
            dairyCo2e: 539.4,
            fruitsVegCo2e: 359.6,
            bakeryCo2e: 179.8,
          };
        }

        config.adapter = () => Promise.resolve({
          data: fallbackData,
          status: 200,
          statusText: 'OK (Static Host Fallback)',
          headers: {},
          config,
        });
        return config;
      }
    }

    // 2. Auth Login
    if (config.url === '/auth/login') {
      const payload = extractPayload(config.data);
      const demoUser = resolveOfflineUser(payload);
      const authData = {
        ...demoUser,
        token: 'OFFLINE_JWT_' + Date.now(),
        type: 'Bearer',
      };
      config.adapter = () => Promise.resolve({
        data: authData,
        status: 200,
        statusText: 'OK (Demo Login)',
        headers: {},
        config,
      });
      return config;
    }

    // 3. Register
    if (config.url === '/auth/register') {
      const payload = extractPayload(config.data);
      const authData = {
        id: Date.now(),
        name: payload.name || 'New Member',
        email: payload.email || 'user@ecoshare.com',
        role: payload.role || 'ROLE_DONOR',
        token: 'OFFLINE_JWT_' + Date.now(),
        type: 'Bearer',
      };
      config.adapter = () => Promise.resolve({
        data: authData,
        status: 200,
        statusText: 'OK (Registered)',
        headers: {},
        config,
      });
      return config;
    }

    // 4. Create Donation
    if (config.url === '/donations/create') {
      const payload = extractPayload(config.data);
      const offlineDonation = {
        ...payload,
        id: 'offline-' + Date.now(),
        status: 'AVAILABLE',
        priorityScore: 90,
        freshnessHoursRemaining: 6.0,
        qrCode: 'ECO-OFFLINE-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        createdAt: new Date().toISOString(),
        isOfflineDraft: true,
      };
      addToSyncQueue({
        type: 'CREATE_DONATION',
        payload,
        summary: `Donation: ${payload.foodName} (${payload.quantityKg} kg)`
      });
      const currentCached = getCachedEndpoint('/donations/my') || [];
      saveCachedEndpoint('/donations/my', [offlineDonation, ...currentCached]);

      config.adapter = () => Promise.resolve({
        data: offlineDonation,
        status: 201,
        statusText: 'Created (Demo Outbox)',
        headers: {},
        config,
      });
      return config;
    }

    // 5. Volunteer Pickup & Delivery
    if (config.url?.startsWith('/volunteer/pickup/')) {
      const parts = config.url.split('/');
      const donationId = parts[parts.length - 1];
      addToSyncQueue({ type: 'PICKUP', donationId });
      config.adapter = () => Promise.resolve({
        data: { success: true, message: 'Pickup recorded' },
        status: 200,
        statusText: 'OK (Demo Pickup)',
        headers: {},
        config,
      });
      return config;
    }

    if (config.url?.startsWith('/volunteer/deliver/')) {
      const donationId = config.url.split('/')[3]?.split('?')[0];
      addToSyncQueue({ type: 'DELIVER', donationId });
      config.adapter = () => Promise.resolve({
        data: { success: true, message: 'Delivery recorded' },
        status: 200,
        statusText: 'OK (Demo Delivery)',
        headers: {},
        config,
      });
      return config;
    }

    // 6. NGO Assign Volunteer
    if (config.url?.startsWith('/ngo/assign-volunteer/')) {
      config.adapter = () => Promise.resolve({
        data: { success: true, message: 'Volunteer assigned successfully' },
        status: 200,
        statusText: 'OK (Assigned)',
        headers: {},
        config,
      });
      return config;
    }

    // 6b. Admin Toggle User Status
    if (config.url?.includes('/admin/users/') && config.url?.endsWith('/toggle')) {
      const parts = config.url.split('/');
      const userId = parseInt(parts[parts.length - 2], 10);
      const currentUsers = getCachedEndpoint('/admin/users') || [];
      const updated = currentUsers.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u);
      saveCachedEndpoint('/admin/users', updated);

      config.adapter = () => Promise.resolve({
        data: { success: true, message: 'User status updated' },
        status: 200,
        statusText: 'OK (User Toggled)',
        headers: {},
        config,
      });
      return config;
    }

    // 6c. Admin Approve NGO
    if (config.url?.includes('/admin/ngo/') && config.url?.endsWith('/approve')) {
      const parts = config.url.split('/');
      const userId = parseInt(parts[parts.length - 2], 10);
      const currentUsers = getCachedEndpoint('/admin/users') || [];
      const updated = currentUsers.map(u => u.id === userId ? { ...u, isApproved: true } : u);
      saveCachedEndpoint('/admin/users', updated);

      config.adapter = () => Promise.resolve({
        data: { success: true, message: 'NGO verified and approved' },
        status: 200,
        statusText: 'OK (NGO Approved)',
        headers: {},
        config,
      });
      return config;
    }

    // 7. AI Quantity Estimator
    if (config.url === '/ai/estimate-quantity') {
      const payload = extractPayload(config.data);
      const densityMap = {
        COOKED_RICE: 0.85,
        COOKED_CURRY: 1.05,
        COOKED_VEGETABLES: 0.70,
        BREAD_BAKERY: 0.45,
        MIXED_MEAL: 0.75,
        RAW_VEGETABLES: 0.50,
        FRUITS: 0.65,
        DAIRY: 1.02,
        SWEETS_DESSERTS: 1.10,
        OTHER: 0.80,
      };
      const volumeMap = {
        STANDARD_5L: 5,
        STANDARD_10L: 10,
        STANDARD_20L: 20,
        STANDARD_50L: 50,
        CUSTOM: payload.customVolumeLiters || 15,
      };
      const vol = volumeMap[payload.containerType] || 20;
      const fillPct = (payload.fillPercentage || 80) / 100;
      const density = densityMap[payload.foodCategory] || 0.85;
      const massMidpoint = Math.round(vol * fillPct * density * 10) / 10;
      const servings = Math.round(massMidpoint * 2.5);

      const aiResponse = {
        estimatedVolumeLiters: Math.round(vol * fillPct * 10) / 10,
        estimatedMassMidpointKg: massMidpoint,
        estimatedMassMinKg: Math.round(massMidpoint * 0.9 * 10) / 10,
        estimatedMassMaxKg: Math.round(massMidpoint * 1.1 * 10) / 10,
        estimatedServingsMidpoint: servings,
        confidenceScore: 94.5,
        detectedFoodCategory: payload.foodCategory || 'COOKED_RICE',
        foodDisplayName: payload.foodCategory ? payload.foodCategory.replace(/_/g, ' ') : 'Cooked Surplus Food',
      };

      config.adapter = () => Promise.resolve({
        data: aiResponse,
        status: 200,
        statusText: 'OK (AI Vision Simulated)',
        headers: {},
        config,
      });
      return config;
    }

    // 8. General Mutating Request Fallback for GitHub Pages
    if (isStaticHost) {
      config.adapter = () => Promise.resolve({
        data: { success: true, message: 'Action processed on static host' },
        status: 200,
        statusText: 'OK (Static Host Processed)',
        headers: {},
        config,
      });
      return config;
    }
  }

  return config;
}, (error) => Promise.reject(error));

// Response interceptor: auto-cache GET requests, and provide fallback when backend is unreachable
client.interceptors.response.use(
  (response) => {
    if (response.config.method?.toLowerCase() === 'get' && response.data) {
      saveCachedEndpoint(response.config.url, response.data);
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;
    const isFallbackNeeded = !response ||
      response.status === 404 ||
      response.status === 405 ||
      response.status >= 500 ||
      error.code === 'ERR_NETWORK' ||
      error.message?.includes('Network Error') ||
      error.code === 'ECONNABORTED';

    if (config && isFallbackNeeded) {
      const method = config.method?.toLowerCase() || 'get';

      // 1. GET requests: serve cached endpoint or seed
      if (method === 'get') {
        const cached = getCachedEndpoint(config.url);
        let fallbackData = cached;
        if (fallbackData === null) {
          if (config.url?.includes('surge')) {
            fallbackData = {
              activeSurgeAlert: false,
              surgeLevel: 'NORMAL',
              elevatedCount: 0,
              criticalBatches: [],
              systemStatus: 'ONLINE',
              lastScanTimestamp: new Date().toISOString()
            };
          } else {
            fallbackData = [];
          }
        }
        return {
          data: fallbackData,
          status: 200,
          statusText: 'OK (Fallback Cache)',
          config,
          headers: {},
          offline: true,
        };
      }

      // 2. Auth Login fallback
      if (config.url === '/auth/login') {
        const payload = extractPayload(config.data);
        const demoUser = resolveOfflineUser(payload);
        const authData = {
          ...demoUser,
          token: 'OFFLINE_JWT_' + Date.now(),
          type: 'Bearer',
        };
        return {
          data: authData,
          status: 200,
          statusText: 'OK (Demo Login)',
          config,
          headers: {},
          offline: true,
        };
      }

      // 3. Create Donation fallback
      if (config.url === '/donations/create') {
        const payload = extractPayload(config.data);
        const offlineDonation = {
          ...payload,
          id: 'offline-' + Date.now(),
          status: 'AVAILABLE',
          priorityScore: 90,
          freshnessHoursRemaining: 6.0,
          qrCode: 'ECO-OFFLINE-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
          createdAt: new Date().toISOString(),
          isOfflineDraft: true,
        };
        addToSyncQueue({
          type: 'CREATE_DONATION',
          payload,
          summary: `Donation: ${payload.foodName} (${payload.quantityKg} kg)`
        });
        const currentCached = getCachedEndpoint('/donations/my') || [];
        saveCachedEndpoint('/donations/my', [offlineDonation, ...currentCached]);

        return {
          data: offlineDonation,
          status: 201,
          statusText: 'Created (Demo Outbox)',
          config,
          headers: {},
          offline: true,
        };
      }

      if (isStaticHost) {
        return {
          data: { success: true, offline: true },
          status: 200,
          statusText: 'OK (Static Host Recovery)',
          config,
          headers: {},
          offline: true,
        };
      }
    }

    if (isStaticHost) {
      return Promise.resolve({
        data: { success: true, offline: true },
        status: 200,
        statusText: 'OK (Static Host Clean)',
        config: config || {},
        headers: {},
        offline: true,
      });
    }

    return Promise.reject(error);
  }
);

export default client;
