// src/environments/environment.ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8001/',  // Configurable Django backend URL
  appName: 'Service Flow Designer',
  version: '1.0.0',
  features: {
    enableServiceWorker: false,
    enableAnalytics: false,
    enableLogger: true,
    enableDevTools: true
  },
  api: {
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  auth: {
    tokenKey: 'flow_designer_token',
    refreshTokenKey: 'flow_designer_refresh_token',
    tokenExpirationBuffer: 300 // 5 minutes before expiration
  },
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 100
  }
};
