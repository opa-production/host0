import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// NOTE: Supabase is used ONLY for document storage
// User authentication and data are handled by your Python backend
const SUPABASE_URL = 'https://gfckrsileiezyfywavnvh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmY2tyc2lsZWl6eWZ5YXdhbnZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MTk0ODAsImV4cCI6MjA3OTk5NTQ4MH0.792-obXshR7glQeCMetuha2zQlVCH7CvlLAcHPSTbw8';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmY2tyc2lsZWl6eWZ5YXdhbnZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDQxOTQ4MCwiZXhwIjoyMDc5OTk1NDgwfQ.O34_-ragHFNUF-d6_L8AiOk40jOHaWPb0lxW332uaUY';

// Create Supabase client for storage operations (uses anon key)
// This client is used for document uploads - no user authentication required
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase admin client for server-side operations (uses service role key)
// WARNING: Only use this in secure server environments, never expose in client code
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Storage bucket name for legal compliance documents
export const LEGAL_DOCS_BUCKET = 'legal-compliance-docs';

export default supabase;

