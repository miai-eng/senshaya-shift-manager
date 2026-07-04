import Link from 'next/link'
import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { archiveEmployee, restoreEmployee } from './actions'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Employee = {
  id: string
  name: string
  phone: string
  visa_type: string | null
  weekly_hour_limit: number | null
  is_active: boolean
  recurring_days_off: { day_of_week: number }[]
}

type Status = 'active' | 'archived' | 'all'

const STATUS_LABELS: Record<Status, string> = {
  active: 'Active',
  archived: 'Archived',
  all: 'All',
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  await requireManager()

  const { q = '', status = 'active' } = await searchParams
  const currentStatus = (
    ['active', 'archived', 'all'].includes(status) ? status : 'active'
  ) as Status

  const supabase = await createClient()
  let query = supabase
    .from('employees')
    .select(
      'id, name, phone, visa_type, weekly_hour_limit, is_active, recurring_days_off(day_of_week)',
    )
    .order('display_order').order('name')

  if (currentStatus === 'active') query = query.eq('is_active', true)
  else if (currentStatus === 'archived') query = query.eq('is_active', false)

  if (q.trim()) {
    const escaped = q.trim().replace(/[%_\\]/g, '\\$&')
    query = query.ilike('name', `%${escaped}%`)
  }

  const { data: employees } = await query

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Employees</h1>
        <Link
          href="/employees/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          + Add Employee
        </Link>
      </div>

      <form method="GET" action="/employees" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name"
          className="rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={currentStatus}
          className="rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        >
          {(['active', 'archived', 'all'] as Status[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded border border-zinc-400 px-3 py-2 text-sm hover:bg-zinc-100"
        >
          Filter
        </button>
        {(q || currentStatus !== 'active') && (
          <Link
            href="/employees"
            className="rounded border border-zinc-400 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            Reset
          </Link>
        )}
      </form>

      {!employees || employees.length === 0 ? (
        <p className="text-sm text-zinc-500">No employees found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                <th className="pr-4 pb-2 font-medium">Name</th>
                <th className="pr-4 pb-2 font-medium">Phone</th>
                <th className="pr-4 pb-2 font-medium">Visa type</th>
                <th className="pr-4 pb-2 font-medium">Weekly hrs</th>
                <th className="pr-4 pb-2 font-medium">Regular days off</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(employees as Employee[]).map((emp) => (
                <tr key={emp.id} className={emp.is_active ? '' : 'opacity-50'}>
                  <td className="py-3 pr-4 font-medium">{emp.name}</td>
                  <td className="py-3 pr-4 font-mono text-xs">
                    {'*'.repeat(emp.phone.length - 4) + emp.phone.slice(-4)}
                  </td>
                  <td className="py-3 pr-4 text-zinc-600">{emp.visa_type ?? '—'}</td>
                  <td className="py-3 pr-4 text-zinc-600">
                    {emp.weekly_hour_limit != null ? `${emp.weekly_hour_limit}h` : '—'}
                  </td>
                  <td className="py-3 pr-4 text-zinc-600">
                    {emp.recurring_days_off.length > 0
                      ? emp.recurring_days_off
                          .map((d) => DAY_LABELS[d.day_of_week])
                          .sort((a, b) => DAY_LABELS.indexOf(a) - DAY_LABELS.indexOf(b))
                          .join(', ')
                      : '—'}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/employees/${emp.id}/edit`}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                      >
                        Edit
                      </Link>
                      {emp.is_active ? (
                        <form action={archiveEmployee}>
                          <input type="hidden" name="id" value={emp.id} />
                          <button
                            type="submit"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          >
                            Archive
                          </button>
                        </form>
                      ) : (
                        <form action={restoreEmployee}>
                          <input type="hidden" name="id" value={emp.id} />
                          <button
                            type="submit"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          >
                            Restore
                          </button>
                        </form>
                      )}
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
