import { createClient } from '@supabase/supabase-js'

// Privileged client that bypasses RLS. Usage must be limited to:
// 1. API routes that have verified SHORTCUT_API_TOKEN
// 2. The public schedule page (inside a Server Component, read-only, confirmed dates only)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
