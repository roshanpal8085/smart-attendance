export const BLE_SCAN_DURATION_MS = 5_000;
export const PRESENCE_CHECK_INTERVAL_MS = 30_000;
export const BLE_MIN_RSSI = -80;
export const SESSION_DURATION_SECONDS = 120;
export const PRESENCE_REQUIRED_SECONDS = 900; // 15 minutes minimum continuous presence
export const KEYCHAIN_SERVICE = 'smart-attendance-tokens';
export const API_TIMEOUT_MS = 10_000;

export const DEFAULT_API_BASE_URL = 'http://10.0.2.2:8000/api/v1';
export const DEFAULT_WS_BASE_URL = 'ws://10.0.2.2:8000';

export const COLORS = {
  primary: '#1e3a8a',       // Deep blue
  primaryDark: '#172554',
  primaryLight: '#3b82f6',
  accent: '#0d9488',        // Teal
  success: '#16a34a',       // Green
  warning: '#d97706',       // Amber
  error: '#dc2626',         // Red
  background: '#f8fafc',    // Slate 50
  surface: '#ffffff',       // Pure white
  border: '#e2e8f0',        // Slate 200
  divider: '#f1f5f9',       // Slate 100
  text: '#0f172a',          // Slate 900
  textSecondary: '#64748b', // Slate 500
  textMuted: '#94a3b8',     // Slate 400
  disabled: '#cbd5e1',      // Slate 300
  shadow: '#0f172a',
};

export const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile_cache',
  LAST_ROLE: 'last_authenticated_role',
  REMEMBER_EMAIL: 'remember_email',
  OFFLINE_EVIDENCE_QUEUE: 'offline_evidence_queue',
};
