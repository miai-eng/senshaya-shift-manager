'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import type { DaysOffState } from '@/app/(dashboard)/days-off/actions'

type Action = (prevState: DaysOffState, formData: FormData) => Promise<DaysOffState>

type Employee = { id: string; name: string }

interface DaysOffFormProps {
  action: Action
  employees: Employee[]
  defaultValues?: {
    id?: string
    employee_id?: string
    start_date?: string
    end_date?: string
    reason?: string | null
  }
}

export function DaysOffForm({ action, employees, defaultValues = {} }: DaysOffFormProps) {
  const [state, formAction] = useActionState(action, {})

  const [fields, setFields] = useState({
    employee_id: defaultValues.employee_id ?? '',
    start_date: defaultValues.start_date ?? '',
    end_date: defaultValues.end_date ?? '',
    reason: defaultValues.reason ?? '',
  })

  const update =
    (key: keyof typeof fields) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }))

  return (
    <form action={formAction} className="space-y-5">
      {defaultValues.id && <input type="hidden" name="id" value={defaultValues.id} />}

      {state.error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <label htmlFor="employee_id" className="block text-sm font-medium">
          従業員 <span className="text-red-500">*</span>
        </label>
        <select
          id="employee_id"
          name="employee_id"
          value={fields.employee_id}
          onChange={update('employee_id')}
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        >
          <option value="">選択してください</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        {state.fieldErrors?.employee_id && (
          <p className="text-xs text-red-600">{state.fieldErrors.employee_id}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label htmlFor="start_date" className="block text-sm font-medium">
            開始日 <span className="text-red-500">*</span>
          </label>
          <input
            id="start_date"
            name="start_date"
            type="date"
            value={fields.start_date}
            onChange={update('start_date')}
            className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
          />
          {state.fieldErrors?.start_date && (
            <p className="text-xs text-red-600">{state.fieldErrors.start_date}</p>
          )}
        </div>
        <div className="space-y-1">
          <label htmlFor="end_date" className="block text-sm font-medium">
            終了日 <span className="text-red-500">*</span>
          </label>
          <input
            id="end_date"
            name="end_date"
            type="date"
            value={fields.end_date}
            onChange={update('end_date')}
            className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
          />
          {state.fieldErrors?.end_date && (
            <p className="text-xs text-red-600">{state.fieldErrors.end_date}</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="reason" className="block text-sm font-medium">
          理由
        </label>
        <textarea
          id="reason"
          name="reason"
          rows={3}
          value={fields.reason}
          onChange={update('reason')}
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
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
