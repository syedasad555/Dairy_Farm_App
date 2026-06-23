/**
 * @deprecated Legacy file — MVR Farms uses Firebase SDK, not Express REST API.
 * Kept for backward compatibility with old screens under src/screens/.
 */
export {
  getEmulatorHost,
  getFirebaseEmulatorEndpoints,
  FIREBASE_EMULATOR_PORTS,
} from '../lib/firebase/emulatorHost';

import { getFirebaseEmulatorEndpoints } from '../lib/firebase/emulatorHost';

/** Firebase Emulator UI URL (port 4000), NOT an Express /api backend */
export const getApiUrl = () => getFirebaseEmulatorEndpoints().ui;

export const API_BASE_URL = getApiUrl();
