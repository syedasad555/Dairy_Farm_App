import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Firebase Emulator Suite ports (not Express — there is no /api backend) */
export const FIREBASE_EMULATOR_PORTS = {
  auth: 9099,
  firestore: 8080,
  functions: 5001,
  storage: 9199,
  ui: 4000,
} as const;

function parseHost(raw?: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/^exp:\/\//, '').replace(/^https?:\/\//, '');
  const host = cleaned.split(':')[0];
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

/**
 * Host for Firebase emulators when running on a physical device or emulator.
 * Auto-detects from Expo Go (same IP as Metro bundler) when possible.
 */
export function getEmulatorHost(): string {
  const fromEnv = process.env.EXPO_PUBLIC_EMULATOR_HOST;
  if (fromEnv) {
    return fromEnv.replace(/^https?:\/\//, '').split(':')[0];
  }

  const fromExpo =
    Constants.expoGoConfig?.debuggerHost ??
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest2?: { extra?: { expoGo?: { debuggerHost?: string } } } }).manifest2?.extra
      ?.expoGo?.debuggerHost;

  const detected = parseHost(fromExpo);
  if (detected) return detected;

  if (Platform.OS === 'android') return '10.0.2.2';
  return '127.0.0.1';
}

export function getFirebaseEmulatorEndpoints(host = getEmulatorHost()) {
  return {
    host,
    auth: `http://${host}:${FIREBASE_EMULATOR_PORTS.auth}`,
    firestore: `${host}:${FIREBASE_EMULATOR_PORTS.firestore}`,
    functions: `${host}:${FIREBASE_EMULATOR_PORTS.functions}`,
    storage: `${host}:${FIREBASE_EMULATOR_PORTS.storage}`,
    ui: `http://${host}:${FIREBASE_EMULATOR_PORTS.ui}`,
  };
}

if (__DEV__) {
  const endpoints = getFirebaseEmulatorEndpoints();
  console.log('[Firebase Emulators]', endpoints);
}
