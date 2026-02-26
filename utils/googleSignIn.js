import { GOOGLE_CLIENT_ID } from '../config/api';

let GoogleSignin = null;
let statusCodes = {};

try {
  const module = require('@react-native-google-signin/google-signin');
  GoogleSignin = module.GoogleSignin;
  statusCodes = module.statusCodes;
  GoogleSignin.configure({
    webClientId: GOOGLE_CLIENT_ID,
    offlineAccess: false,
  });
} catch (e) {
  // Native module not available (e.g. Expo Go)
}

export { GoogleSignin, statusCodes };
