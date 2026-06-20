'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import type { EmployeeState } from '@/app/(dashboard)/employees/actions'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

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
  const [state, formAction] = useActionState(action, {})
  const [offDays, setOffDays] = useState(new Set(defaultOffDays))

  const [fields, setFields] = useState({
    name: defaultValues.name ?? '',
    phone: defaultValues.phone ?? '',
    visa_type: defaultValues.visa_type ?? '',
    weekly_hour_limit: defaultValues.weekly_hour_limit?.toString() ?? '',
    notes: defaultValues.notes ?? '',
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
        <label htmlFor="name" className="block text-sm font-medium">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          value={fields.name}
          onChange={update('name')}
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-red-600">{state.fieldErrors.name}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="phone" className="block text-sm font-medium">
          Phone <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          value={fields.phone}
          onChange={update('phone')}
          placeholder="+16041234567"
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
        <p className="text-xs text-zinc-500">E.164 format starting with +1 (11 digits, no hyphens)</p>
        {state.fieldErrors?.phone && (
          <p className="text-xs text-red-600">{state.fieldErrors.phone}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="visa_type" className="block text-sm font-medium">
          Visa type
        </label>
        <select
          id="visa_type"
          name="visa_type"
          value={fields.visa_type}
          onChange={update('visa_type')}
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        >
          <option value="">Select</option>
          <option value="Working Holiday">Working Holiday</option>
          <option value="Study Permit">Study Permit</option>
          <option value="Work Permit">Work Permit</option>
          <option value="PR">PR</option>
          <option value="Others">Others</option>
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="weekly_hour_limit" className="block text-sm font-medium">
          Weekly hour limit
        </label>
        <input
          id="weekly_hour_limit"
          name="weekly_hour_limit"
          type="number"
          min={1}
          value={fields.weekly_hour_limit}
          onChange={update('weekly_hour_limit')}
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
        {state.fieldErrors?.weekly_hour_limit && (
          <p className="text-xs text-red-600">{state.fieldErrors.weekly_hour_limit}</p>
        )}
      </div>

      <div className="space-y-1">
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={fields.notes}
          onChange={update('notes')}
          className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Fixed days off</p>
        <div className="flex flex-wrap gap-3">
          {DAY_LABELS.map((label, dow) => (
            <label key={dow} className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                name="day_of_week"
                value={dow}
                checked={offDays.has(dow)}
                onChange={(e) => {
                  setOffDays((prev) => {
                    const next = new Set(prev)
                    e.target.checked ? next.add(dow) : next.delete(dow)
                    return next
                  })
                }}
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
        Save
      </button>
    </form>
  )
}
