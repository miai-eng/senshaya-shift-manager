import { createClient } from '@supabase/supabase-js'

// RLSをバイパスする特権クライアント。使用箇所は以下に限定すること:
// 1. SHORTCUT_API_TOKEN 検証済みのAPIルート
// 2. 公開スケジュールページ (サーバーコンポーネント内・読み取り専用・確定日の範囲に限定)
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}
