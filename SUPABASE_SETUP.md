# Supabase Setup Guide for Legal Compliance Documents

This guide explains how to set up Supabase for uploading legal compliance documents (PDFs and images) in the Ardena Host app.

## Important Architecture Note

**Supabase is used ONLY for document storage.** User authentication, user data, and all other application data are handled by your Python backend server. Supabase is not used for user authentication or database operations.

## Prerequisites

- Supabase account and project
- Supabase project URL
- Supabase Anon Key
- Supabase Service Role Key (for admin operations)
- Python backend server for user authentication and data management

## Configuration

### 1. Supabase Project Details

The Supabase configuration is stored in `config/supabase.js`:

- **Project URL**: `https://gfckrsileiezyfywavnvh.supabase.co`
- **Anon Key**: Already configured
- **Service Role Key**: Already configured (for server-side operations only)

### 2. Storage Bucket Setup

You need to create a storage bucket in your Supabase project:

1. Go to your Supabase Dashboard
2. Navigate to **Storage** section
3. Click **New bucket**
4. Create a bucket named: `legal-compliance-docs`
5. Set the bucket to **Public** (recommended for easier access) or **Private** (if you need signed URLs)
6. Configure bucket policies:

**Note:** Since you're using your own Python backend for authentication, you can use either:
- **Public bucket** with anonymous uploads (simpler, but less secure)
- **Private bucket** with service role key for uploads (more secure)

For public bucket (simpler setup):

#### Public Bucket Policy (Recommended - No Authentication Required)

```sql
-- Allow anonymous uploads (since authentication is handled by your Python backend)
CREATE POLICY "Allow anonymous uploads"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'legal-compliance-docs');

-- Allow public read access
CREATE POLICY "Public can read documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'legal-compliance-docs');
```

#### Alternative: Private Bucket with Service Role (More Secure)

If you prefer a private bucket, you can use the service role key for uploads. The app will use the service role key (which bypasses RLS) for uploads. This is more secure but requires the service role key in the app.

**Note:** The service role key is already in the config file. For production, consider:
1. Using a public bucket with anonymous uploads (simpler)
2. Or creating a server-side endpoint in your Python backend that handles uploads using the service role key

### 3. File Size Limits

By default, Supabase has a 50MB file size limit. If you need larger files:

1. Go to **Settings** → **API** in Supabase Dashboard
2. Adjust the file size limit if needed
3. Update the upload service if you need to handle larger files

## Project Structure

```
ardenahost/
├── config/
│   └── supabase.js          # Supabase client configuration
├── services/
│   └── documentUpload.js    # Document upload service
└── screens/
    └── LegalComplianceScreen.js  # Legal compliance upload screen
```

## Usage

### User Authentication Flow

1. User logs in through your Python backend
2. Python backend returns user ID and authentication token
3. App stores user ID in AsyncStorage using `setUserId(userId)` from `utils/userStorage.js`
4. User ID is used to organize documents in Supabase Storage

### Uploading Documents

The `LegalComplianceScreen` automatically uploads documents to Supabase when a user selects a file:

1. User selects a document (PDF or image)
2. App retrieves user ID from AsyncStorage (set after login with Python backend)
3. Document is uploaded to Supabase Storage with user ID in the path
4. File path and URL are stored in component state
5. User can submit all documents - paths are sent to your Python backend API

### Document Types

- **logbook**: Vehicle logbook (required)
- **insurance**: Valid insurance cover (required)
- **inspection**: Inspection certificate (required)
- **manual**: Car manual (optional)

### File Organization

Documents are organized in storage as:
```
legal-compliance-docs/
  └── {userId}/
      ├── logbook_{timestamp}_{filename}
      ├── insurance_{timestamp}_{filename}
      ├── inspection_{timestamp}_{filename}
      └── manual_{timestamp}_{filename}
```

## API Functions

### `uploadDocument(file, userId, documentType)`

Uploads a single document to Supabase Storage.

**Parameters:**
- `file`: Object with `{ uri, name, type }`
- `userId`: User ID for organizing files (optional)
- `documentType`: Type of document (logbook, insurance, inspection, manual)

**Returns:**
```javascript
{
  success: boolean,
  url?: string,      // Public URL of uploaded file
  path?: string,     // Storage path
  error?: string     // Error message if failed
}
```

### `uploadMultipleDocuments(files, userId)`

Uploads multiple documents at once.

**Parameters:**
- `files`: Object with document types as keys
- `userId`: User ID for organizing files

**Returns:**
Array of upload results for each document type.

### `deleteDocument(filePath)`

Deletes a document from Supabase Storage.

**Parameters:**
- `filePath`: Path to the file in storage

**Returns:**
```javascript
{
  success: boolean,
  error?: string
}
```

### `getDocumentUrl(filePath)`

Gets the public URL for a document.

**Parameters:**
- `filePath`: Path to the file in storage

**Returns:**
Public URL string

## Backend Integration

### Sending Document Data to Your Python Backend

When the user submits documents, the app prepares data to send to your Python backend:

```javascript
{
  userId: "user_123",
  documents: {
    logbook: {
      path: "user_123/logbook_1234567890_document.pdf",
      url: "https://gfckrsileiezyfywavnvh.supabase.co/storage/v1/object/public/legal-compliance-docs/...",
      name: "document.pdf"
    },
    insurance: { ... },
    inspection: { ... },
    manual: { ... }
  }
}
```

### Python Backend Endpoint Example

You should create an endpoint in your Python backend to receive this data:

```python
# Example Flask endpoint
@app.route('/api/legal-documents', methods=['POST'])
@require_auth  # Your authentication decorator
def submit_legal_documents():
    data = request.json
    user_id = data['userId']
    documents = data['documents']
    
    # Save document metadata to your database
    # Update user's legal compliance status
    # etc.
    
    return jsonify({'success': True})
```

### Storing Document Metadata

Store document metadata in your Python backend database (not Supabase):

- User ID (from your backend)
- Document type (logbook, insurance, inspection, manual)
- Supabase file path
- Supabase file URL
- File name
- Upload timestamp
- Verification status

## Security Considerations

1. **Service Role Key**: Never expose the service role key in client-side code. It's included in the config file for reference but should only be used in secure server environments.

2. **File Validation**: Consider adding file validation:
   - File size limits
   - File type validation
   - Virus scanning (if available)

3. **Access Control**: Use Row Level Security (RLS) policies to ensure users can only access their own documents.

4. **Rate Limiting**: Consider implementing rate limiting to prevent abuse.

## Troubleshooting

### Upload Fails

1. Check if the storage bucket exists and is properly configured
2. Verify bucket policies allow uploads
3. Check file size limits
4. Ensure network connectivity

### Files Not Accessible

1. Check if bucket is set to public or if signed URLs are needed
2. Verify bucket policies allow read access
3. Check file paths are correct

### Authentication Issues

1. Ensure user is authenticated before uploading
2. Check RLS policies if using database integration
3. Verify API keys are correct

## Next Steps

1. **User Authentication**: Integrate with Supabase Auth to get actual user IDs
2. **Database Integration**: Store document metadata in database
3. **Verification Workflow**: Implement document verification process
4. **Notifications**: Add notifications when documents are verified
5. **Document Viewing**: Add ability to view uploaded documents
6. **Document Replacement**: Allow users to replace documents

## Support

For Supabase-specific issues, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

