import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Strip Metro port from debugger host, e.g. "192.168.0.167:8082" → "192.168.0.167" */
function parseHost(raw) {
  if (!raw) return null;
  const cleaned = raw.replace(/^exp:\/\//, '').replace(/^https?:\/\//, '');
  const host = cleaned.split(':')[0];
  return host || null;
}

function getDevHost() {
  const raw =
    Constants.expoGoConfig?.debuggerHost ||
    Constants.expoConfig?.hostUri;

  const host = parseHost(raw);
  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return host;
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return '127.0.0.1';
}

export const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return `http://${getDevHost()}:5000/api`;
};

export const API_BASE_URL = getApiUrl();

if (__DEV__) {
  console.log('[API] Using backend:', API_BASE_URL);
}
