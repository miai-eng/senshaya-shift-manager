import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyShortcutToken } from '@/lib/auth/shortcut'

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyShortcutToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    typeof (body as Record<string, unknown>).shift_id !== 'string' ||
    typeof (body as Record<string, unknown>).message_body !== 'string'
  ) {
    return NextResponse.json({ error: 'shift_id and message_body are required' }, { status: 400 })
  }

  const { shift_id, message_body } = body as { shift_id: string; message_body: string }

  const supabase = createAdminClient()

  const { error: updateError } = await supabase
    .from('shifts')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', shift_id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update shift status' }, { status: 500 })
  }

  const { error: logError } = await supabase.from('message_logs').insert({ shift_id, message_body })

  if (logError) {
    return NextResponse.json({ error: 'Failed to record send log' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
