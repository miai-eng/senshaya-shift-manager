'use client'

import { useActionState } from 'react'
import type { EmployeeState } from '@/app/(dashboard)/employees/actions'

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

type Action = (prevState: EmployeeState, formData: FormData) => Promise<EmployeeState>

interface EmployeeFormProps {
  action: Action
  defaultValues?: {
    id?: string
    name?: string
    phone?: string
    visa_type?: string | null
    weekly_hour_limit?: number | null
    notes?: string | null
  }
  defaultOffDays?: number[]
}

export function EmployeeForm({
  action,
  defaultValues = {},
  defaultOffDays = [],
}: EmployeeFormProps) {
  const offDaySet = new Set(defaultOffDays)
  const [state, formAction] = useActionState(action, {})

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues.id && <input type="hidden" name="id" value={defaultValues.id} />}

      {state.error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="name" className="block text-sm font-medium">
          氏名 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          defaultValue={defaultValues.name}
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-red-600">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="phone" className="block text-sm font-medium">
          電話番号 <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues.phone}
          placeholder="+16041234567"
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
        <p className="text-xs text-zinc-500">E.164形式（+1 から始まる11桁）</p>
        {state.fieldErrors?.phone && (
          <p className="text-xs text-red-600">{state.fieldErrors.phone}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="visa_type" className="block text-sm font-medium">
          ビザ種別
        </label>
        <input
          id="visa_type"
          name="visa_type"
          type="text"
          defaultValue={defaultValues.visa_type ?? ''}
          placeholder="例: Work Permit, PR, Working Holiday"
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="weekly_hour_limit" className="block text-sm font-medium">
          週間労働時間上限
        </label>
        <input
          id="weekly_hour_limit"
          name="weekly_hour_limit"
          type="number"
          min={1}
          defaultValue={defaultValues.weekly_hour_limit ?? ''}
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
        {state.fieldErrors?.weekly_hour_limit && (
          <p className="text-xs text-red-600">{state.fieldErrors.weekly_hour_limit}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium">
          備考
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues.notes ?? ''}
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">定期休み（曜日固定）</p>
        <div className="flex flex-wrap gap-3">
          {DAY_LABELS.map((label, dow) => (
            <label key={dow} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="day_of_week"
                value={dow}
                defaultChecked={offDaySet.has(dow)}
                className="rounded border-zinc-400"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        保存する
      </button>
    </form>
  )
}
