import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = 'https://uopitdnufrnxkhhhdtxk.supabase.co';
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvcGl0ZG51ZnJueGtoaGhkdHhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwOTI5NjQsImV4cCI6MjA3OTY2ODk2NH0.88GIbGzDrd-t7ycUeXPxH-pYQh7DUoFm8-35whVoj6k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});