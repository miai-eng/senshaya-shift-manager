import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '@/lib/supabase/admin'

const VANCOUVER_TZ = 'America/Vancouver'
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function todayInVancouver(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VANCOUVER_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function formatDateHeader(dateStr: string): { label: string; dow: number } {
  const d = new Date(dateStr + 'T12:00:00Z')
  const dow = d.getUTCDay()
  return {
    label: `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${DAY_LABELS[dow]})`,
    dow,
  }
}

function formatTime(t: string): string {
  const [h, m] = t.split(':')
  return `${parseInt(h, 10)}:${m}`
}

function createAnonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } },
  )
}

type ShiftRow = {
  employee_id: string
  shift_date: string
  start_time: string | null
  note: string | null
  is_off: boolean
}

type Employee = {
  id: string
  name: string
}

type RequestedOffRow = {
  employee_id: string
  start_date: string
  end_date: string
}

type RecurringOffRow = {
  employee_id: string
  day_of_week: number
}

export default async function PublicSchedulePage() {
  const supabase = createAnonClient()
  const today = todayInVancouver()

  // Confirmed dates from the last 7 days onward
  const sevenDaysAgo = new Date(today + 'T12:00:00Z')
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
  const rangeStart = sevenDaysAgo.toISOString().slice(0, 10)

  const [{ data: locks }, { data: employeesRaw }] = await Promise.all([
    supabase
      .from('shift_locks')
      .select('shift_date')
      .gte('shift_date', rangeStart)
      .order('shift_date', { ascending: true }),
    supabase.from('employees').select('id, name').order('display_order').order('name'),
  ])

  const lockedDates: string[] = (locks ?? []).map((l) => l.shift_date as string)
  const employees: Employee[] = (employeesRaw ?? []) as Employee[]

  if (lockedDates.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">No confirmed shifts yet.</p>
      </div>
    )
  }

  const firstLocked = lockedDates[0]
  const lastLocked = lockedDates[lockedDates.length - 1]

  // Off-type classification (requested / recurring days off).
  // These tables intentionally have no anon RLS policies: opening them up would
  // expose all time-off data (including unconfirmed future requests) through the
  // public API. Instead we read them server-side with the service-role client,
  // scoped to the confirmed date range this page renders anyway. Read-only.
  const admin = createAdminClient()

  const [{ data: shiftsRaw }, { data: requestedRaw }, { data: recurringRaw }] = await Promise.all([
    supabase
      .from('shifts')
      .select('employee_id, shift_date, start_time, note, is_off')
      .in('shift_date', lockedDates),
    admin
      .from('requested_days_off')
      .select('employee_id, start_date, end_date')
      .lte('start_date', lastLocked)
      .gte('end_date', firstLocked),
    admin.from('recurring_days_off').select('employee_id, day_of_week'),
  ])

  const shifts = (shiftsRaw ?? []) as ShiftRow[]
  const requestedOff = (requestedRaw ?? []) as RequestedOffRow[]
  const recurringOff = (recurringRaw ?? []) as RecurringOffRow[]

  // employee_id:shift_date → shift
  const shiftMap = new Map<string, ShiftRow>()
  for (const s of shifts) {
    shiftMap.set(`${s.employee_id}:${s.shift_date}`, s)
  }

  const requestedByEmployee = new Map<string, RequestedOffRow[]>()
  for (const r of requestedOff) {
    if (!requestedByEmployee.has(r.employee_id)) requestedByEmployee.set(r.employee_id, [])
    requestedByEmployee.get(r.employee_id)!.push(r)
  }

  const recurringByEmployee = new Map<string, Set<number>>()
  for (const r of recurringOff) {
    if (!recurringByEmployee.has(r.employee_id)) recurringByEmployee.set(r.employee_id, new Set())
    recurringByEmployee.get(r.employee_id)!.add(r.day_of_week)
  }

  const dowByDate = new Map<string, number>(
    lockedDates.map((d) => [d, new Date(d + 'T12:00:00Z').getUTCDay()]),
  )

  function isRequestedOff(empId: string, date: string): boolean {
    return (requestedByEmployee.get(empId) ?? []).some(
      (r) => r.start_date <= date && date <= r.end_date,
    )
  }

  function isRecurringOff(empId: string, date: string): boolean {
    return recurringByEmployee.get(empId)?.has(dowByDate.get(date)!) ?? false
  }

  // Only show employees that have at least one shift row
  const activeEmployeeIds = new Set(shifts.map((s) => s.employee_id))
  const visibleEmployees = employees.filter((e) => activeEmployeeIds.has(e.id))

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-zinc-200 px-4 py-4">
        <h1 className="text-lg font-bold">Shift Schedule</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-24 border-r border-b border-zinc-200 bg-white px-3 py-2 text-left text-xs font-medium text-zinc-500">
                Name
              </th>
              {lockedDates.map((date) => {
                const { label, dow } = formatDateHeader(date)
                const isToday = date === today
                const color =
                  dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-zinc-700'
                return (
                  <th
                    key={date}
                    className={`min-w-20 border-r border-b border-zinc-200 px-2 py-2 text-center text-xs font-medium whitespace-nowrap ${isToday ? 'bg-zinc-50' : 'bg-white'}`}
                  >
                    <span className={color}>{label}</span>
                    {isToday && (
                      <span className="ml-1 rounded bg-zinc-800 px-1 py-0.5 text-xs text-white">
                        Today
                      </span>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visibleEmployees.map((emp) => (
              <tr key={emp.id}>
                <td className="sticky left-0 z-10 border-r border-b border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-900">
                  {emp.name}
                </td>
                {lockedDates.map((date) => {
                  const shift = shiftMap.get(`${emp.id}:${date}`) ?? null
                  const requested = isRequestedOff(emp.id, date)
                  const recurring = isRecurringOff(emp.id, date)
                  return (
                    <td
                      key={date}
                      className="border-r border-b border-zinc-200 px-2 py-2 text-center"
                    >
                      {shift && !shift.is_off ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-medium text-zinc-800">
                            {shift.start_time ? formatTime(shift.start_time) : '—'}
                          </span>
                          {shift.note && (
                            <span className="text-xs text-zinc-500">{formatTime(shift.note)}</span>
                          )}
                        </div>
                      ) : requested ? (
                        <span className="text-xs font-medium text-blue-500">RO</span>
                      ) : recurring ? (
                        <span className="text-xs font-medium text-zinc-900">OFF</span>
                      ) : shift?.is_off ? (
                        <span className="text-xs font-medium text-red-500">OFF</span>
                      ) : (
                        <span className="text-xs text-zinc-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-4 px-4 py-3 text-xs text-zinc-500">
        <span>
          <span className="font-medium text-red-500">OFF</span> Day off
        </span>
        <span>
          <span className="font-medium text-blue-500">RO</span> Requested off
        </span>
        <span>
          <span className="font-medium text-zinc-900">OFF</span> Fixed day off
        </span>
      </div>
      <p className="px-4 pb-3 text-xs text-zinc-400">Only confirmed dates are shown.</p>
    </div>
  )
}
