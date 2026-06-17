import { createServerClient } from '@supabase/ssr'
import Link from 'next/link'

const VANCOUVER_TZ = 'America/Vancouver'

function todayInVancouver(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VANCOUVER_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  const DOW = ['日', '月', '火', '水', '木', '金', '土']
  return `${month}/${day} (${DOW[d.getDay()]})`
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
  start_time: string | null
  is_off: boolean
  employees: { name: string } | null
}

export default async function PublicSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date: dateParam } = await searchParams
  const supabase = createAnonClient()

  const { data: locks } = await supabase
    .from('shift_locks')
    .select('shift_date')
    .order('shift_date', { ascending: true })

  const lockedDates: string[] = (locks ?? []).map((l) => l.shift_date as string)

  if (lockedDates.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <p className="text-zinc-500">確定済みのシフトはまだありません。</p>
      </div>
    )
  }

  const today = todayInVancouver()
  let selectedDate =
    dateParam && lockedDates.includes(dateParam) ? dateParam : null
  if (!selectedDate) {
    selectedDate =
      lockedDates.find((d) => d >= today) ?? lockedDates[lockedDates.length - 1]
  }

  const { data: shiftsRaw } = await supabase
    .from('shifts')
    .select('employee_id, start_time, is_off, employees(name)')
    .eq('shift_date', selectedDate)

  const shifts = ((shiftsRaw ?? []) as unknown as ShiftRow[]).sort((a, b) => {
    if (a.is_off && !b.is_off) return 1
    if (!a.is_off && b.is_off) return -1
    return (a.start_time ?? '').localeCompare(b.start_time ?? '')
  })

  const idx = lockedDates.indexOf(selectedDate)
  const prevDate = idx > 0 ? lockedDates[idx - 1] : null
  const nextDate = idx < lockedDates.length - 1 ? lockedDates[idx + 1] : null

  return (
    <div className="min-h-screen bg-white px-4 py-8">
      <div className="mx-auto max-w-sm space-y-6">
        <h1 className="text-center text-xl font-bold">シフト確認</h1>

        <div className="flex items-center justify-between">
          {prevDate ? (
            <Link
              href={`/schedule?date=${prevDate}`}
              className="rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              ← {formatDate(prevDate)}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-lg font-semibold">{formatDate(selectedDate)}</span>
          {nextDate ? (
            <Link
              href={`/schedule?date=${nextDate}`}
              className="rounded px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              {formatDate(nextDate)} →
            </Link>
          ) : (
            <span />
          )}
        </div>

        {shifts.length === 0 ? (
          <p className="text-center text-zinc-500">この日のシフトはありません。</p>
        ) : (
          <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200">
            {shifts.map((s) => (
              <div
                key={s.employee_id}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="font-medium">{s.employees?.name ?? '—'}</span>
                <span className={s.is_off ? 'text-zinc-400' : 'font-medium text-zinc-800'}>
                  {s.is_off ? '休み' : s.start_time ? s.start_time.slice(0, 5) + '〜' : '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-zinc-400">
          確定済みの日のみ表示されます
        </p>
      </div>
    </div>
  )
}
