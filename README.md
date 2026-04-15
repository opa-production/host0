# Ardena Host - Car Rental Host App

A React Native app built with Expo for managing car rental hosting.

## Setup Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Add Black Chocolate Font (Optional):**
   - Download the Black Chocolate font from [Google Fonts](https://fonts.google.com/specimen/Black+Chocolate) or your font source
   - Place the font file `BlackChocolate-Regular.ttf` in the `assets/fonts/` directory
   - If you have multiple weights, you can add them and update the code accordingly

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on your device:**
   - Install Expo Go app on your iOS or Android device
   - Scan the QR code displayed in the terminal or browser
   - The app will load on your device

## App Structure

### Screens

- **LandingScreen** - Welcome/landing page with CTAs
- **LoginScreen** - Email/password login with Google and Apple sign-in options
- **SignUpScreen** - Registration with email/password and social auth
- **HomeScreen** - Main dashboard (placeholder)
- **BookingsScreen** - Manage bookings (placeholder)
- **HostScreen** - Add cars and services (placeholder)
- **MessagesScreen** - Conversations (placeholder)
- **ProfileScreen** - User profile (placeholder)

### Navigation

- **Stack Navigator** - Handles authentication flow (Landing → Login/SignUp → Main App)
- **Bottom Tab Navigator** - Main app navigation with 5 tabs:
  - Home
  - Bookings
  - Host
  - Messages
  - Profile

## Features

- Clean, modern UI design
- Brand color (#007AFF) for CTAs and active states
- Black Chocolate font for headings (with system fallback)
- White background throughout
- Email/password authentication forms
- Social authentication buttons (Google & Apple) with official icons
- Bottom tab navigation with icons
- Responsive layout

## Project Structure

```
ardenahost/
├── App.js                    # Main app entry point
├── app.json                  # Expo configuration
├── package.json              # Dependencies
├── babel.config.js           # Babel configuration
├── navigation/
│   └── AppNavigator.js       # Navigation setup
├── screens/
│   ├── LandingScreen.js      # Landing page
│   ├── LoginScreen.js        # Login screen
│   ├── SignUpScreen.js       # Sign up screen
│   ├── HomeScreen.js         # Home tab
│   ├── BookingsScreen.js     # Bookings tab
│   ├── HostScreen.js         # Host tab
│   ├── MessagesScreen.js     # Messages tab
│   └── ProfileScreen.js      # Profile tab
├── assets/
│   ├── fonts/                # Font files
│   └── images/               # Image assets
└── README.md                 # This file
```

## Dependencies

- Expo SDK 50
- React Native 0.73.2
- React Navigation 6.x
- Expo Vector Icons (for icons)
- Custom font loading with expo-font

## Development Notes

- The app uses React Navigation for routing
- Bottom tabs use Ionicons from @expo/vector-icons
- Google and Apple sign-in buttons are ready but need backend integration
- All screens are placeholder-ready for future content
- Font loading is handled gracefully with system fallback

## Building for Distribution

This project uses [EAS Build](https://docs.expo.dev/build/introduction/) (Expo Application Services). Make sure you have the EAS CLI installed and are logged in before running any build commands.

### Prerequisites

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login
```

---

### Build APK (Direct Download / Sideload)

Use the `preview` profile to produce a standalone `.apk` file that users can download and install directly — no Play Store required.

```bash
eas build --profile preview --platform android
```

- Build runs in the cloud on Expo's servers.
- When complete, the Expo dashboard ([expo.dev](https://expo.dev)) will show a download link for the `.apk`.
- Download the `.apk` and host it on your website so users can install it directly.

> **Note for users installing the APK:** Android will prompt "Install from unknown sources". Users need to allow installation from the browser or file manager in their device settings.

---

### Build AAB (Google Play Store)

Use the `production` profile to produce an `.aab` (Android App Bundle) for submitting to the Google Play Store.

```bash
eas build --profile production --platform android
```

- The `.aab` format is required by the Play Store and cannot be sideloaded directly.
- Download the `.aab` from the Expo dashboard and upload it in the [Google Play Console](https://play.google.com/console).

---

### Local Build (No Expo Servers)

If you want to build locally on your machine (requires Android Studio + JDK installed):

```bash
# APK
eas build --profile preview --platform android --local

# AAB
eas build --profile production --platform android --local
```

---

### Build Profiles Summary

| Profile | Output | Use Case |
|---|---|---|
| `preview` | `.apk` | Direct download, sideloading, beta testing |
| `production` | `.aab` | Google Play Store submission |
| `development` | Dev client | Internal development with dev tools |

---

### Hosting the APK on Your Website

1. Run `eas build --profile preview --platform android`
2. Download the `.apk` from [expo.dev/accounts/chinesedeon/projects/ardenahost/builds](https://expo.dev/accounts/chinesedeon/projects/ardenahost/builds)
3. Upload the `.apk` to your web server or file hosting
4. Link to it on your site — users tap the link, download, and install

Example download button HTML:
```html
<a href="/downloads/ardenahost.apk" download>Download Ardena Host APK</a>
```

---

## Next Steps

1. Implement authentication logic
2. Add backend API integration
3. Implement Google and Apple authentication
4. Add content to placeholder screens
5. Add app icons and splash screens
