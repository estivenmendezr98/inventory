import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: import.meta.env.VITE_KC_URL || 'http://localhost:8080',
  realm: import.meta.env.VITE_KC_REALM || 'inventory',
  clientId: import.meta.env.VITE_KC_CLIENT_ID || 'inventory-app',
});

/** Single shared promise — React 18 StrictMode runs effects twice; a second `init()` breaks Keycloak-js. */
let initPromise: Promise<boolean> | null = null;

export function initKeycloakOnce(): Promise<boolean> {
  if (!initPromise) {
    keycloak.onTokenExpired = () => {
      void keycloak.updateToken(70);
    };
    initPromise = keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false,
      pkceMethod: 'S256',
    });
  }
  return initPromise;
}

export default keycloak;
