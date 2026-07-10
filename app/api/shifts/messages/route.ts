import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyShortcutToken } from '@/lib/auth/shortcut'
import { renderTemplate } from '@/lib/utils/render-template'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

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
    return NextResponse.json({ error: 'date parameter is required (YYYY-MM-DD)' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const dayOfWeek = new Date(date + 'T12:00:00Z').getUTCDay()

  const [
    { data: shifts, error: shiftsError },
    { data: templates, error: templatesError },
    { data: requestedOff, error: requestedError },
    { data: recurringOff, error: recurringError },
  ] = await Promise.all([
    supabase
      .from('shifts')
      .select('id, employee_id, start_time, is_off, employees(name, phone, is_manager)')
      .eq('shift_date', date),
    supabase.from('message_templates').select('type, body'),
    supabase
      .from('requested_days_off')
      .select('employee_id')
      .lte('start_date', date)
      .gte('end_date', date),
    supabase.from('recurring_days_off').select('employee_id').eq('day_of_week', dayOfWeek),
  ])

  if (shiftsError || templatesError || requestedError || recurringError) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }

  // Days off the employee already requested (requested/recurring) need no notification
  const knownOffEmployeeIds = new Set([
    ...(requestedOff ?? []).map((r) => r.employee_id),
    ...(recurringOff ?? []).map((r) => r.employee_id),
  ])

  const attendTemplate = templates?.find((t) => t.type === 'attend')?.body ?? ''
  const offTemplate = templates?.find((t) => t.type === 'off')?.body ?? ''
  const dateLabel = formatMessageDate(date)

  const messages = (shifts ?? [])
    .filter((shift) => !(shift.is_off && knownOffEmployeeIds.has(shift.employee_id)))
    .map((shift) => {
      const employee = Array.isArray(shift.employees) ? shift.employees[0] : shift.employees
      if (!employee) return null
      // Managers don't receive SMS (excluded whether default 9:00, manual entry, or Off)
      if (employee.is_manager) return null

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
