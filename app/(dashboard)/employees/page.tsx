import Link from 'next/link'
import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { archiveEmployee, restoreEmployee } from './actions'

type Employee = {
  id: string
  name: string
  phone: string
  visa_type: string | null
  weekly_hour_limit: number | null
  is_active: boolean
}

type Status = 'active' | 'archived' | 'all'

const STATUS_LABELS: Record<Status, string> = {
  active: 'アクティブ',
  archived: 'アーカイブ済み',
  all: 'すべて',
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  await requireManager()

  const { q = '', status = 'active' } = await searchParams
  const currentStatus = (['active', 'archived', 'all'].includes(status)
    ? status
    : 'active') as Status

  const supabase = await createClient()
  let query = supabase
    .from('employees')
    .select('id, name, phone, visa_type, weekly_hour_limit, is_active')
    .order('name')

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
        <h1 className="text-2xl font-bold">従業員管理</h1>
        <Link
          href="/employees/new"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          ＋ 従業員を追加
        </Link>
      </div>

      {/* 検索・フィルター */}
      <form method="GET" action="/employees" className="flex flex-wrap gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="氏名で検索"
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
          絞り込む
        </button>
        {(q || currentStatus !== 'active') && (
          <Link
            href="/employees"
            className="rounded border border-zinc-400 px-3 py-2 text-sm hover:bg-zinc-100"
          >
            リセット
          </Link>
        )}
      </form>

      {/* 一覧 */}
      {!employees || employees.length === 0 ? (
        <p className="text-sm text-zinc-500">該当する従業員が見つかりません。</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500">
                <th className="pb-2 pr-4 font-medium">氏名</th>
                <th className="pb-2 pr-4 font-medium">電話番号</th>
                <th className="pb-2 pr-4 font-medium">ビザ種別</th>
                <th className="pb-2 pr-4 font-medium">週間上限</th>
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
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Link
                        href={`/employees/${emp.id}/edit`}
                        className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                      >
                        編集
                      </Link>
                      {emp.is_active ? (
                        <form action={archiveEmployee}>
                          <input type="hidden" name="id" value={emp.id} />
                          <button
                            type="submit"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          >
                            アーカイブ
                          </button>
                        </form>
                      ) : (
                        <form action={restoreEmployee}>
                          <input type="hidden" name="id" value={emp.id} />
                          <button
                            type="submit"
                            className="rounded border border-zinc-300 px-2 py-1 text-xs hover:bg-zinc-100"
                          >
                            復元
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
