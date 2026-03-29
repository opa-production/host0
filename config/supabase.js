import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// NOTE: Supabase is used ONLY for document storage
// User authentication and data are handled by your Python backend
const SUPABASE_URL = 'https://mvzddrdfkgydoitrblpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12emRkcmRma2d5ZG9pdHJibHBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NzUwMjIsImV4cCI6MjA4MjU1MTAyMn0.g1Y4gOHwNyk_Wff_JtIZborgOsGfSccVASEikPR05gI';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12emRkcmRma2d5ZG9pdHJibHBxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Njk3NTAyMiwiZXhwIjoyMDgyNTUxMDIyfQ.o0csPVj6MLCNa0_crtBllxl8UgkivrXOjZ08KZUqpg0';

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

export const STORAGE_BUCKETS = {
  VEHICLE_MEDIA: 'vehicle-media',
  CAR_VIDEOS: 'carvideos',
  HOST_DOCUMENTS: 'host-documents',
  HOST_PROFILE: 'host-profile-images',
  CLIENT_PROFILE_MEDIA: 'client-profile-media',
};

export default supabase;

