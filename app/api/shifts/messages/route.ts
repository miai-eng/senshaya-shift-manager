import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyShortcutToken } from '@/lib/auth/shortcut'
import { renderTemplate } from '@/lib/utils/render-template'

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const

function formatMessageDate(date: string): string {
  const d = new Date(date + 'T12:00:00Z')
  const dow = DAY_LABELS[d.getUTCDay()]
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${dow})`
}

function formatTime(t: string): string {
  const [h, m] = t.split(':')
  return `${parseInt(h, 10)}:${m}`
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyShortcutToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const date = request.nextUrl.searchParams.get('date')
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'date パラメータが必要です (YYYY-MM-DD)' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const [{ data: shifts, error: shiftsError }, { data: templates, error: templatesError }] =
    await Promise.all([
      supabase
        .from('shifts')
        .select('id, start_time, is_off, employees(name, phone)')
        .eq('shift_date', date),
      supabase.from('message_templates').select('type, body'),
    ])

  if (shiftsError || templatesError) {
    return NextResponse.json({ error: 'データの取得に失敗しました' }, { status: 500 })
  }

  const attendTemplate = templates?.find((t) => t.type === 'attend')?.body ?? ''
  const offTemplate = templates?.find((t) => t.type === 'off')?.body ?? ''
  const dateLabel = formatMessageDate(date)

  const messages = (shifts ?? [])
    .map((shift) => {
      const employee = Array.isArray(shift.employees) ? shift.employees[0] : shift.employees
      if (!employee) return null

      const body = shift.is_off
        ? renderTemplate(offTemplate, { date: dateLabel })
        : renderTemplate(attendTemplate, {
            date: dateLabel,
            time: formatTime(shift.start_time!),
          })

      return { phone: employee.phone, body, shift_id: shift.id }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  return NextResponse.json({ date, messages })
}
