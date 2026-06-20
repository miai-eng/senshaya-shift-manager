import { createServerClient } from '@supabase/ssr'

const VANCOUVER_TZ = 'America/Vancouver'
const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'] as const

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
  is_off: boolean
}

type Employee = {
  id: string
  name: string
}

export default async function PublicSchedulePage() {
  const supabase = createAnonClient()
  const today = todayInVancouver()

  // 過去7日〜未来の確定済み日付を取得
  const sevenDaysAgo = new Date(today + 'T12:00:00Z')
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7)
  const rangeStart = sevenDaysAgo.toISOString().slice(0, 10)

  const [{ data: locks }, { data: employeesRaw }] = await Promise.all([
    supabase
      .from('shift_locks')
      .select('shift_date')
      .gte('shift_date', rangeStart)
      .order('shift_date', { ascending: true }),
    supabase.from('employees').select('id, name').order('name'),
  ])

  const lockedDates: string[] = (locks ?? []).map((l) => l.shift_date as string)
  const employees: Employee[] = (employeesRaw ?? []) as Employee[]

  if (lockedDates.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">確定済みのシフトはまだありません。</p>
      </div>
    )
  }

  const { data: shiftsRaw } = await supabase
    .from('shifts')
    .select('employee_id, shift_date, start_time, is_off')
    .in('shift_date', lockedDates)

  const shifts = (shiftsRaw ?? []) as ShiftRow[]

  // employee_id:shift_date → shift のマップ
  const shiftMap = new Map<string, ShiftRow>()
  for (const s of shifts) {
    shiftMap.set(`${s.employee_id}:${s.shift_date}`, s)
  }

  // シフトが1件でもある従業員のみ表示
  const activeEmployeeIds = new Set(shifts.map((s) => s.employee_id))
  const visibleEmployees = employees.filter((e) => activeEmployeeIds.has(e.id))

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-zinc-200 px-4 py-4">
        <h1 className="text-lg font-bold">シフト確認</h1>
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-24 border-b border-r border-zinc-200 bg-white px-3 py-2 text-left text-xs font-medium text-zinc-500">
                名前
              </th>
              {lockedDates.map((date) => {
                const { label, dow } = formatDateHeader(date)
                const isToday = date === today
                const color =
                  dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-zinc-700'
                return (
                  <th
                    key={date}
                    className={`min-w-20 border-b border-r border-zinc-200 px-2 py-2 text-center text-xs font-medium whitespace-nowrap ${isToday ? 'bg-zinc-50' : 'bg-white'}`}
                  >
                    <span className={color}>{label}</span>
                    {isToday && (
                      <span className="ml-1 rounded bg-zinc-800 px-1 py-0.5 text-xs text-white">
                        今日
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
                <td className="sticky left-0 z-10 border-b border-r border-zinc-200 bg-white px-3 py-2 font-medium text-zinc-900">
                  {emp.name}
                </td>
                {lockedDates.map((date) => {
                  const shift = shiftMap.get(`${emp.id}:${date}`) ?? null
                  return (
                    <td
                      key={date}
                      className="border-b border-r border-zinc-200 px-2 py-2 text-center"
                    >
                      {shift ? (
                        shift.is_off ? (
                          <span className="text-xs text-zinc-400">休み</span>
                        ) : (
                          <span className="text-xs font-medium text-zinc-800">
                            {shift.start_time ? shift.start_time.slice(0, 5) : '—'}
                          </span>
                        )
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

      <p className="px-4 py-3 text-xs text-zinc-400">確定済みの日のみ表示されます</p>
    </div>
  )
}
