import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { ShiftGrid } from '@/components/features/shift-grid'

function buildDateRange(startDate: string, days: number): string[] {
  const dates: string[] = []
  const base = new Date(startDate + 'T12:00:00Z')
  for (let i = 0; i < days; i++) {
    const d = new Date(base)
    d.setUTCDate(d.getUTCDate() + i)
    dates.push(d.toISOString().slice(0, 10))
  }
  return dates
}

const VANCOUVER_TZ = 'America/Vancouver'

function todayInVancouver(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VANCOUVER_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function defaultStartDate(): string {
  const today = todayInVancouver()
  const d = new Date(today + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - 3)
  return d.toISOString().slice(0, 10)
}

export default async function ShiftsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  await requireManager()

  const { date } = await searchParams
  const startDate = date ?? defaultStartDate()
  const today = todayInVancouver()
  const dates = buildDateRange(startDate, 7)
  const endDate = dates[dates.length - 1]

  const supabase = await createClient()

  const [{ data: employees }, { data: requestedDaysOff }, { data: shifts }, { data: locks }] = await Promise.all([
    supabase
      .from('employees')
      .select('id, name, notes, weekly_hour_limit, is_manager, recurring_days_off(day_of_week)')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('requested_days_off')
      .select('employee_id, start_date, end_date')
      .lte('start_date', endDate)
      .gte('end_date', startDate),
    supabase
      .from('shifts')
      .select('id, employee_id, shift_date, start_time, is_off, status')
      .gte('shift_date', startDate)
      .lte('shift_date', endDate),
    supabase
      .from('shift_locks')
      .select('shift_date')
      .gte('shift_date', startDate)
      .lte('shift_date', endDate),
  ])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Shifts</h1>
      <ShiftGrid
        employees={employees ?? []}
        dates={dates}
        requestedDaysOff={requestedDaysOff ?? []}
        initialShifts={shifts ?? []}
        lockedDates={(locks ?? []).map((l) => l.shift_date)}
        startDate={startDate}
        today={today}
      />
    </div>
  )
}
