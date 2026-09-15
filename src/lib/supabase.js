import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.warn('Supabase is not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local')
}

// Captured before the client reads and clears it: email links arrive with their result in the URL hash
export const initialUrlHash = window.location.hash

// null until the env vars are set, so the public pages keep working without them
export const supabase = url && key ? createClient(url, key) : null
