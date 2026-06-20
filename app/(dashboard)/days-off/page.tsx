import Link from 'next/link'
import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { deleteDaysOff } from './actions'

type DaysOff = {
  id: string
  start_date: string
  end_date: string
  reason: string | null
  employees: { name: string } | { name: string }[] | null
}

function getEmployeeName(employees: DaysOff['employees']): string {
  if (!employees) return '—'
  if (Array.isArray(employees)) return employees[0]?.name ?? '—'
  return employees.name
}

export default async function DaysOffPage({
  searchParams,
}: {
  searchParams: Promise<{ employee_id?: string; period?: string }>
}) {
  await requireManager()

  const { employee_id = '', period = 'all' } = await searchParams
  const today = new Date().toISOString().split('T')[0]

  const supabase = await createClient()

  const { data: employees } = await supabase
    .from('employees')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  let query = supabase
    .from('requested_days_off')
    .select('id, start_date, end_date, reason, employees(name)')
    .order('start_date', { ascending: false })

  if (employee_id) query = query.eq('employee_id', employee_id)
  if (period === 'upcoming') query = query.gte('end_date', today)
  else if (period === 'past') query = query.lt('end_date', today)

  const { data: daysOff } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Time Off</h1>
        <Link
          href="/days-off/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Add Time Off
        </Link>
      </div>

      <form method="GET" action="/days-off" className="flex flex-wrap gap-2">
        <select
          name="employee_id"
          defaultValue={employee_id}
          className="rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        >
          <option value="">All employees</option>
          {(employees ?? []).map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select
          name="period"
          defaultValue={period}
          className="rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        >
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
          <option value="all">All</option>
        </select>
        <button
          type="submit"
          className="rounded border border-zinc-400 px-3 py-2 text-sm hover:bg-zinc-100"
        >
          Filter
        </button>
        {(employee_id || period !== 'all') && (
          <Link
            href="/days-off"
            className="rounded border border-zinc-400 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Reset
          </Link>
        )}
      </form>

      {!daysOff || daysOff.length === 0 ? (
        <p className="text-sm text-zinc-500">No time off records found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                <th className="pr-4 pb-2 font-medium">Employee</th>
                <th className="pr-4 pb-2 font-medium">Start date</th>
                <th className="pr-4 pb-2 font-medium">End date</th>
                <th className="pr-4 pb-2 font-medium">Reason</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(daysOff as DaysOff[]).map((d) => (
                <tr key={d.id}>
                  <td className="py-3 pr-4 font-medium">{getEmployeeName(d.employees)}</td>
                  <td className="py-3 pr-4">{d.start_date}</td>
                  <td className="py-3 pr-4">{d.end_date}</td>
                  <td className="py-3 pr-4 text-zinc-600">{d.reason ?? '—'}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/days-off/${d.id}/edit`}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                      >
                        Edit
                      </Link>
                      <form action={deleteDaysOff}>
                        <input type="hidden" name="id" value={d.id} />
                        <button
                          type="submit"
                          className="rounded border border-zinc-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
