# Building Standalone APK for OpaHost

This guide will help you build a standalone APK that can be installed on Android devices without requiring your PC to be running.

## Prerequisites

1. **Expo Account**: Sign up at https://expo.dev (free)
2. **EAS CLI**: Install globally with `npm install -g eas-cli`
3. **Login to EAS**: Run `eas login` in your terminal

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Login to Expo

```bash
eas login
```

## Step 3: Configure Project

The project is already configured with:
- App icon: `assets/images/logo.png`
- Package name: `com.opahost.app`
- Version: `1.0.0`

## Step 4: Build APK

### Option A: Build Preview APK (Recommended for testing)

```bash
eas build --platform android --profile preview
```

This will:
- Build a standalone APK
- Upload it to Expo servers
- Give you a download link
- Takes about 15-20 minutes

### Option B: Build Production APK

```bash
eas build --platform android --profile production
```

## Step 5: Download APK

After the build completes:
1. You'll get a URL in the terminal
2. Open the URL in your browser
3. Download the APK file
4. Share with friends - they can install directly

## Alternative: Local Build (Requires Android Studio)

If you prefer to build locally:

```bash
npx expo prebuild
npx expo run:android --variant release
```

The APK will be in: `android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Image Upload Error
- Make sure `expo-image-picker` plugin is in `app.json` (already added)
- Rebuild the app after adding the plugin

### Icon Not Showing
- Ensure `logo.png` is in `assets/images/` folder
- Icon should be at least 1024x1024px
- Run `npx expo prebuild --clean` if icon doesn't update

## Notes

- The APK will be standalone - no PC needed
- First build may take longer (20-30 minutes)
- Subsequent builds are faster (10-15 minutes)
- APK size: ~30-50MB (includes all assets)

