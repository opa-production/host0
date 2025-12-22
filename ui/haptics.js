import { Platform, Vibration } from 'react-native';

export function lightHaptic() {
  try {
    // Optional dependency in Expo projects
    // eslint-disable-next-line global-require
    const Haptics = require('expo-haptics');
    if (Haptics?.impactAsync && Haptics?.ImpactFeedbackStyle?.Light) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
  } catch (e) {
    // ignore
  }

  // Fallback: very short vibration (Android). iOS may ignore.
  if (Platform.OS === 'android') {
    Vibration.vibrate(8);
  }
}
