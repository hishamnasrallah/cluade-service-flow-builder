// src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiBaseUrl: 'http://localhost:8001',  // Production Django backend URL
  appName: 'Service Flow Designer',
  version: '1.0.0',
  features: {
    enableServiceWorker: true,
    enableAnalytics: true,
    enableLogger: false,
    enableDevTools: false
  },
  api: {
    timeout: 60000,
    retryAttempts: 5,
    retryDelay: 2000
  },
  auth: {
    tokenKey: 'flow_designer_token',
    refreshTokenKey: 'flow_designer_refresh_token',
    tokenExpirationBuffer: 300
  },
  cache: {
    ttl: 600000, // 10 minutes
    maxSize: 200
  }
};
