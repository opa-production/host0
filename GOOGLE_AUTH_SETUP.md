# Google Authentication Setup Guide

This guide explains how to configure Google Sign-In for the Ardena Host app.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. Access to Google Cloud Console

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API** or **Google Identity API**
4. Go to **APIs & Services** > **Credentials**
5. Click **Create Credentials** > **OAuth client ID**

## Step 2: Configure OAuth Client IDs

### For Expo Go (Development)

1. Select **Web application** as the application type
2. Name it: "Ardena Host - Expo Go"
3. Add authorized redirect URIs:
   - `https://auth.expo.io/@your-expo-username/ardenahost`
   - Replace `your-expo-username` with your Expo username
4. Copy the **Client ID** (it looks like: `xxxxx.apps.googleusercontent.com`)

### For Production Builds

#### Android:
1. Select **Android** as the application type
2. Name it: "Ardena Host - Android"
3. Enter your app's package name: `com.ardenahost.app`
4. Get your SHA-1 certificate fingerprint:
   ```bash
   # For debug builds
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   
   # For release builds (use your release keystore)
   keytool -list -v -keystore your-release-key.keystore -alias your-key-alias
   ```
5. Add the SHA-1 fingerprint to the OAuth client
6. Copy the **Client ID**

#### iOS:
1. Select **iOS** as the application type
2. Name it: "Ardena Host - iOS"
3. Enter your bundle identifier: `com.ardenahost.app`
4. Copy the **Client ID**

## Step 3: Update App Configuration

### Option 1: Update LoginScreen.js directly

Edit `screens/LoginScreen.js` and replace the placeholder:

```javascript
const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
  expoClientId: 'YOUR_GOOGLE_WEB_CLIENT_ID', // Replace with your Web Client ID
  // For production builds, uncomment and add:
  // androidClientId: 'YOUR_ANDROID_CLIENT_ID',
  // iosClientId: 'YOUR_IOS_CLIENT_ID',
});
```

### Option 2: Use Environment Variables (Recommended)

1. Install `expo-constants` if not already installed:
   ```bash
   npm install expo-constants
   ```

2. Create a `.env` file in the project root:
   ```
   GOOGLE_EXPO_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
   GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
   GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
   ```

3. Install `react-native-dotenv`:
   ```bash
   npm install react-native-dotenv
   ```

4. Update `babel.config.js`:
   ```javascript
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         ['module:react-native-dotenv', {
           moduleName: '@env',
           path: '.env',
         }]
       ],
     };
   };
   ```

5. Update `LoginScreen.js`:
   ```javascript
   import { GOOGLE_EXPO_CLIENT_ID, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_IOS_CLIENT_ID } from '@env';
   
   const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
     expoClientId: GOOGLE_EXPO_CLIENT_ID,
     androidClientId: GOOGLE_ANDROID_CLIENT_ID,
     iosClientId: GOOGLE_IOS_CLIENT_ID,
   });
   ```

## Step 4: Install Dependencies

Run the following command to install required packages:

```bash
npm install
```

This will install:
- `expo-auth-session` - For Google OAuth authentication
- `expo-web-browser` - For opening the OAuth flow in a browser

## Step 5: Test the Integration

1. Start your Expo development server:
   ```bash
   npm start
   ```

2. Open the app on your device/simulator
3. Tap the "Google" button on the login screen
4. You should see the Google sign-in flow
5. After signing in, you should be authenticated and redirected to the main app

## Troubleshooting

### "Invalid client ID" error
- Make sure you're using the correct client ID for your environment (Expo Go vs standalone build)
- Verify the client ID is correctly copied (no extra spaces)

### "Redirect URI mismatch" error
- For Expo Go: Ensure the redirect URI matches exactly: `https://auth.expo.io/@your-username/ardenahost`
- Check your Expo username matches in the redirect URI

### "id_token is null" error
- This is a known issue with `useIdTokenAuthRequest` in some Android builds
- Try using `Google.useAuthRequest` instead and extract the id_token from the response
- Or use `@react-native-google-signin/google-signin` for more reliable native Google Sign-In

### Button shows spinner but nothing happens
- Check the console logs for errors
- Verify your backend API endpoint `/api/v1/host/auth/google` is working
- Ensure the backend accepts `id_token` in the request body: `{ "id_token": "..." }`

## Backend API Requirements

Your backend should accept POST requests to `/api/v1/host/auth/google` with:

**Request Body:**
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

**Response (Success):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 3600,
  "host": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    ...
  }
}
```

**Response (Error):**
```json
{
  "detail": "Error message here"
}
```

## Security Notes

- Never commit your OAuth client IDs to public repositories
- Use environment variables or secure configuration management
- Keep your OAuth client secrets secure (backend only)
- Regularly rotate credentials if compromised
