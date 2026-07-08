import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { renderTemplate } from '@/lib/utils/render-template'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function formatMessageDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const dow = DAY_LABELS[d.getUTCDay()]
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()} (${dow})`
}

function formatTime(t: string): string {
  const [h, m] = t.split(':')
  return `${parseInt(h, 10)}:${m}`
}

type EmployeeInfo = { name: string; is_manager: boolean }

type ShiftWithEmployee = {
  id: string
  employee_id: string
  start_time: string | null
  is_off: boolean
  employees: EmployeeInfo | EmployeeInfo[] | null
}

export default async function MessagesPreviewPage({
  params,
}: {
  params: Promise<{ date: string }>
}) {
  await requireManager()

  const { date } = await params

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound()

  const supabase = await createClient()
  const dayOfWeek = new Date(date + 'T12:00:00Z').getUTCDay()

  const [
    { data: lock },
    { data: shifts },
    { data: templates },
    { data: requestedOff },
    { data: recurringOff },
  ] = await Promise.all([
    supabase.from('shift_locks').select('shift_date').eq('shift_date', date).single(),
    supabase
      .from('shifts')
      .select('id, employee_id, start_time, is_off, employees(name, is_manager)')
      .eq('shift_date', date)
      .order('start_time', { ascending: true, nullsFirst: false }),
    supabase.from('message_templates').select('type, body'),
    supabase
      .from('requested_days_off')
      .select('employee_id')
      .lte('start_date', date)
      .gte('end_date', date),
    supabase.from('recurring_days_off').select('employee_id').eq('day_of_week', dayOfWeek),
  ])

  if (!lock) notFound()

  // 本人が申請済みのオフ（リクエストオフ・定期オフ）はSMS生成APIでも除外されるため、
  // プレビューにも表示しない（生成APIのフィルタと同一のロジック）
  const knownOffEmployeeIds = new Set([
    ...(requestedOff ?? []).map((r) => r.employee_id as string),
    ...(recurringOff ?? []).map((r) => r.employee_id as string),
  ])

  const attendTemplate = templates?.find((t) => t.type === 'attend')?.body ?? ''
  const offTemplate = templates?.find((t) => t.type === 'off')?.body ?? ''
  const dateLabel = formatMessageDate(date)

  const messages = (shifts ?? [])
    .map((shift: ShiftWithEmployee) => {
      const emp = Array.isArray(shift.employees) ? shift.employees[0] : shift.employees
      if (!emp) return null
      if (shift.is_off && knownOffEmployeeIds.has(shift.employee_id)) return null
      // マネージャーにはSMSを送らないため、プレビューにも表示しない
      if (emp.is_manager) return null

      const body = shift.is_off
        ? renderTemplate(offTemplate, { date: dateLabel })
        : renderTemplate(attendTemplate, {
            date: dateLabel,
            time: formatTime(shift.start_time!),
          })

      return { name: emp.name, body, is_off: shift.is_off }
    })
    .filter((m): m is NonNullable<typeof m> => m !== null)

  const working = messages.filter((m) => !m.is_off)
  const off = messages.filter((m) => m.is_off)
  const ordered = [...working, ...off]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/shifts" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Shifts
        </Link>
        <h1 className="text-2xl font-bold">Messages — {dateLabel}</h1>
      </div>

      {ordered.length === 0 ? (
        <p className="text-sm text-zinc-500">No messages to send.</p>
      ) : (
        <>
          <p className="text-sm text-zinc-500">{ordered.length} messages to send</p>

          <div className="space-y-3">
            {ordered.map((m, i) => (
              <div key={i} className="rounded border border-zinc-200 p-4">
                <div className="mb-1.5 text-sm font-semibold text-zinc-900">{m.name}</div>
                <div className="text-sm whitespace-pre-wrap text-zinc-700">{m.body}</div>
              </div>
            ))}
          </div>

          <div className="rounded border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500">
            To send these messages, run the iOS Shortcut on your phone.
          </div>
        </>
      )}
    </div>
  )
}
