import { createClient } from '@supabase/supabase-js'

// ショートカットAPI専用の特権クライアント。
// RLSをバイパスするため、SHORTCUT_API_TOKEN検証済みのルートでのみ使用すること。
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
