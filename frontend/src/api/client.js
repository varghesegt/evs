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

// Demo accounts for instant login anywhere
const OFFLINE_USERS = {
  'donor1@ecoshare.com': { id: 1, name: 'SRM Hotel & Convention Centre', email: 'donor1@ecoshare.com', role: 'ROLE_DONOR' },
  'ngo1@ecoshare.com': { id: 2, name: 'Trichy Seva Sangam Shelter', email: 'ngo1@ecoshare.com', role: 'ROLE_NGO' },
  'vol1@ecoshare.com': { id: 3, name: 'Karthik Raja', email: 'vol1@ecoshare.com', role: 'ROLE_VOLUNTEER' },
  'admin@ecoshare.com': { id: 4, name: 'EcoShare Trichy Administrator', email: 'admin@ecoshare.com', role: 'ROLE_ADMIN' },
};

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
    }

    // 2. Auth Login
    if (config.url === '/auth/login') {
      let payload = {};
      try {
        payload = JSON.parse(config.data || '{}');
      } catch (e) {
        payload = {};
      }
      const email = (payload.email || '').toLowerCase().trim();
      const demoUser = OFFLINE_USERS[email] || {
        id: 1,
        name: email ? email.split('@')[0].toUpperCase() : 'Demo User',
        email: email || 'demo@ecoshare.com',
        role: email.includes('ngo') ? 'ROLE_NGO' : email.includes('vol') ? 'ROLE_VOLUNTEER' : email.includes('admin') ? 'ROLE_ADMIN' : 'ROLE_DONOR',
      };
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
      let payload = {};
      try { payload = JSON.parse(config.data || '{}'); } catch (e) {}
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
      let payload = {};
      try { payload = JSON.parse(config.data || '{}'); } catch (e) {}
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
  }

  return config;
});

// Response interceptor: automatically cache successful GETs and catch any 404/405/network errors
client.interceptors.response.use(
  (response) => {
    if (response.config?.method?.toLowerCase() === 'get' && response.data) {
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
        if (cached !== null) {
          console.info(`[DemoMode] Serving fallback data for ${config.url}`);
          return {
            data: cached,
            status: 200,
            statusText: 'OK (Fallback Cache)',
            config,
            headers: {},
            offline: true,
          };
        }
      }

      // 2. Auth Login fallback
      if (config.url === '/auth/login') {
        try {
          const payload = JSON.parse(config.data || '{}');
          const email = (payload.email || '').toLowerCase().trim();
          const demoUser = OFFLINE_USERS[email] || {
            id: 1,
            name: email ? email.split('@')[0].toUpperCase() : 'Demo User',
            email: email || 'demo@ecoshare.com',
            role: email.includes('ngo') ? 'ROLE_NGO' : email.includes('vol') ? 'ROLE_VOLUNTEER' : email.includes('admin') ? 'ROLE_ADMIN' : 'ROLE_DONOR',
          };
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
        } catch (e) {
          console.warn('[DemoMode] Login fallback error:', e);
        }
      }

      // 3. Create Donation fallback
      if (config.url === '/donations/create') {
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
        } catch (e) {
          console.warn('[DemoMode] Create donation fallback error:', e);
        }
      }
    }

    // Redirect to login on 401 only if not running on static host
    if (response?.status === 401 && !isStaticHost && navigator.onLine) {
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
    if (!isStaticHost) {
      console.info('[Network] Device came online. Triggering sync...');
      processSyncQueue(client);
    }
  });
}

export default client;
