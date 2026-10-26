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

// Demo accounts for offline access
const OFFLINE_USERS = {
  'donor1@ecoshare.com': { id: 1, name: 'SRM Hotel & Convention Centre', email: 'donor1@ecoshare.com', role: 'ROLE_DONOR' },
  'ngo1@ecoshare.com': { id: 2, name: 'Trichy Seva Sangam Shelter', email: 'ngo1@ecoshare.com', role: 'ROLE_NGO' },
  'vol1@ecoshare.com': { id: 3, name: 'Karthik Raja', email: 'vol1@ecoshare.com', role: 'ROLE_VOLUNTEER' },
  'admin@ecoshare.com': { id: 4, name: 'EcoShare Trichy Administrator', email: 'admin@ecoshare.com', role: 'ROLE_ADMIN' },
};

// Attach JWT token to every request
client.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('ecoshare_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Fast offline bypass for GET requests when navigator is offline
  if (typeof navigator !== 'undefined' && !navigator.onLine && config.method?.toLowerCase() === 'get') {
    const cached = getCachedEndpoint(config.url);
    if (cached !== null) {
      config.adapter = () => Promise.resolve({
        data: cached,
        status: 200,
        statusText: 'OK (Offline Cache)',
        headers: {},
        config,
      });
    }
  }

  return config;
});

// Handle responses & offline fallback
client.interceptors.response.use(
  (response) => {
    // Automatically cache successful GET requests for offline browsing
    if (response.config?.method?.toLowerCase() === 'get' && response.data) {
      saveCachedEndpoint(response.config.url, response.data);
    }
    return response;
  },
  async (error) => {
    const { config, response } = error;
    const isNetworkError = !response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.code === 'ECONNABORTED';

    // 1. Offline GET Fallback: Return cached data or offline seed
    if (config && config.method?.toLowerCase() === 'get' && isNetworkError) {
      const cached = getCachedEndpoint(config.url);
      if (cached !== null) {
        console.info(`[OfflineMode] Serving cached data for ${config.url}`);
        return {
          data: cached,
          status: 200,
          statusText: 'OK (Offline Cache)',
          config,
          headers: {},
          offline: true,
        };
      }
    }

    // 2. Offline Login Support for Demo Accounts
    if (config && config.url === '/auth/login' && isNetworkError) {
      try {
        const payload = JSON.parse(config.data || '{}');
        const demoUser = OFFLINE_USERS[payload.email?.toLowerCase()];
        if (demoUser) {
          console.info(`[OfflineMode] Offline demo login successful for ${payload.email}`);
          const offlineAuthData = {
            ...demoUser,
            token: 'OFFLINE_JWT_' + Date.now(),
            type: 'Bearer'
          };
          return {
            data: offlineAuthData,
            status: 200,
            statusText: 'OK (Offline Demo)',
            config,
            headers: {},
            offline: true
          };
        }
      } catch (e) {
        console.warn('[OfflineMode] Failed to parse login body:', e);
      }
    }

    // 3. Offline POST: Create Donation
    if (config && config.url === '/donations/create' && isNetworkError) {
      try {
        const payload = JSON.parse(config.data || '{}');
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

        // Save to offline sync queue
        addToSyncQueue({
          type: 'CREATE_DONATION',
          payload,
          summary: `Donation: ${payload.foodName} (${payload.quantityKg} kg)`
        });

        // Update local cached donations so user sees it right away
        const currentCached = getCachedEndpoint('/donations/my') || [];
        saveCachedEndpoint('/donations/my', [offlineDonation, ...currentCached]);

        return {
          data: offlineDonation,
          status: 201,
          statusText: 'Created (Offline Outbox)',
          config,
          headers: {},
          offline: true
        };
      } catch (e) {
        console.warn('[OfflineMode] Error creating offline donation:', e);
      }
    }

    // 4. Offline Volunteer Pickup
    if (config && config.url?.startsWith('/volunteer/pickup/') && isNetworkError) {
      const parts = config.url.split('/');
      const donationId = parts[parts.length - 1];
      addToSyncQueue({
        type: 'PICKUP',
        donationId,
        summary: `Pickup confirmed for Task #${donationId}`
      });
      return {
        data: { success: true, message: 'Pickup status saved offline' },
        status: 200,
        statusText: 'OK (Offline)',
        config,
        headers: {},
        offline: true
      };
    }

    // 5. Offline Volunteer Delivery
    if (config && config.url?.startsWith('/volunteer/deliver/') && isNetworkError) {
      const donationId = config.url.split('/')[3]?.split('?')[0];
      addToSyncQueue({
        type: 'DELIVER',
        donationId,
        summary: `Delivery confirmed for Task #${donationId}`
      });
      return {
        data: { success: true, message: 'Delivery status saved offline' },
        status: 200,
        statusText: 'OK (Offline)',
        config,
        headers: {},
        offline: true
      };
    }

    // Handle 401 only when online
    if (response?.status === 401 && navigator.onLine) {
      localStorage.removeItem('ecoshare_token');
      localStorage.removeItem('ecoshare_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Listen to online events and auto-sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.info('[Network] Device came online. Triggering sync...');
    processSyncQueue(client);
  });
}

export default client;
