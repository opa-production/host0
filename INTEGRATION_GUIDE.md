# Python Backend Integration Guide

This guide explains how to integrate the Supabase document upload with your Python backend.

## User Authentication Flow

### 1. After Successful Login

When a user successfully logs in through your Python backend, store the user ID in the app:

```javascript
import { setUserId, setUserToken } from './utils/userStorage';

// After successful login API call
const response = await fetch('YOUR_API_URL/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

const data = await response.json();

if (data.success) {
  // Store user ID and token
  await setUserId(data.user.id);
  await setUserToken(data.user.token);
  
  // Navigate to main app
  navigation.replace('MainTabs');
}
```

### 2. Example Login Screen Integration

Update your `LoginScreen.js`:

```javascript
import { setUserId, setUserToken } from '../utils/userStorage';

const handleLogin = async () => {
  try {
    const response = await fetch('YOUR_API_URL/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (data.success) {
      // Store user credentials
      await setUserId(data.user.id);
      await setUserToken(data.user.token);
      
      // Navigate to main app
      navigation.replace('MainTabs');
    } else {
      Alert.alert('Login Failed', data.message || 'Invalid credentials');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to connect to server');
    console.error('Login error:', error);
  }
};
```

## Document Submission API

### Backend Endpoint

Create an endpoint in your Python backend to receive document metadata:

```python
from flask import Flask, request, jsonify
from functools import wraps

app = Flask(__name__)

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        
        # Verify token and get user
        user = verify_token(token)  # Your token verification logic
        if not user:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(user, *args, **kwargs)
    return decorated_function

@app.route('/api/legal-documents', methods=['POST'])
@require_auth
def submit_legal_documents(user):
    data = request.json
    user_id = data['userId']
    documents = data['documents']
    
    # Verify user ID matches authenticated user
    if user_id != user['id']:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Save to your database
    db.legal_documents.insert({
        'user_id': user_id,
        'logbook_path': documents.get('logbook', {}).get('path'),
        'logbook_url': documents.get('logbook', {}).get('url'),
        'insurance_path': documents.get('insurance', {}).get('path'),
        'insurance_url': documents.get('insurance', {}).get('url'),
        'inspection_path': documents.get('inspection', {}).get('path'),
        'inspection_url': documents.get('inspection', {}).get('url'),
        'manual_path': documents.get('manual', {}).get('path'),
        'manual_url': documents.get('manual', {}).get('url'),
        'status': 'pending',
        'submitted_at': datetime.now(),
    })
    
    return jsonify({
        'success': True,
        'message': 'Documents submitted for verification'
    })
```

### Update LegalComplianceScreen

Update the `handleSubmit` function in `LegalComplianceScreen.js` to call your API:

```javascript
import { getUserToken } from '../utils/userStorage';

const handleSubmit = async () => {
  // ... existing code ...
  
  try {
    const userId = await getUserId();
    const token = await getUserToken();
    
    if (!userId || !token) {
      Alert.alert('Authentication Required', 'Please log in to submit documents.');
      return;
    }

    const documentData = {
      userId: userId,
      documents: {
        logbook: uploadedPaths.logbook ? {
          path: uploadedPaths.logbook,
          url: getDocumentUrl(uploadedPaths.logbook),
          name: documents.logbook?.name,
        } : null,
        // ... other documents
      },
    };
    
    // Call your Python backend API
    const response = await fetch('YOUR_API_URL/api/legal-documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(documentData),
    });

    const result = await response.json();

    if (result.success) {
      Alert.alert(
        'Success', 
        'Documents submitted for verification. You will be notified once verification is complete.',
        [{ text: 'OK', onPress: () => nav.goBack() }]
      );
    } else {
      Alert.alert('Error', result.message || 'Failed to submit documents.');
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to connect to server. Please try again.');
    console.error('Submit error:', error);
  } finally {
    setUploading(false);
  }
};
```

## Environment Configuration

Create a config file for your API URL:

```javascript
// config/api.js
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api'  // Development
  : 'https://your-production-api.com/api';  // Production
```

Then use it in your API calls:

```javascript
import { API_BASE_URL } from '../config/api';

const response = await fetch(`${API_BASE_URL}/login`, { ... });
```

## Summary

1. **After Login**: Store user ID and token using `setUserId()` and `setUserToken()`
2. **Document Upload**: Documents are automatically uploaded to Supabase when selected
3. **Document Submission**: Send document metadata (paths and URLs) to your Python backend
4. **Backend Storage**: Store document metadata in your own database
5. **Verification**: Handle document verification workflow in your Python backend

The app handles Supabase uploads automatically. You just need to:
- Store user ID after login
- Create an API endpoint to receive document metadata
- Update the submit handler to call your API

