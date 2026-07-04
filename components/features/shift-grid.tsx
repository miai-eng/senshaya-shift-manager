'use client'

import { useOptimistic, useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertShift, deleteShift, lockDate, unlockDate } from '@/app/(dashboard)/shifts/actions'

const PRESET_TIMES = ['9:00', '10:00', '11:00', '13:00'] as const
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

type Employee = {
  id: string
  name: string
  notes: string | null
  weekly_hour_limit: number | null
  is_manager: boolean
  recurring_days_off: { day_of_week: number }[]
}

type RequestedDayOff = {
  employee_id: string
  start_date: string
  end_date: string
}

type Shift = {
  id: string
  employee_id: string
  shift_date: string
  start_time: string | null
  is_off: boolean
  status: string
}

type ShiftKey = string // `${employee_id}:${shift_date}`

type ShiftMap = Record<ShiftKey, Shift>

interface ShiftGridProps {
  employees: Employee[]
  dates: string[]
  requestedDaysOff: RequestedDayOff[]
  initialShifts: Shift[]
  lockedDates: string[]
  startDate: string
  today: string
}

function toShiftMap(shifts: Shift[]): ShiftMap {
  const map: ShiftMap = {}
  for (const s of shifts) {
    map[`${s.employee_id}:${s.shift_date}`] = s
  }
  return map
}

function formatTime(t: string): string {
  const [h, m] = t.split(':')
  return `${parseInt(h, 10)}:${m}`
}

function toDbTime(t: string): string {
  const [h, m] = t.split(':')
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`
}

function formatDateHeader(date: string): { label: string; dow: number } {
  const d = new Date(date + 'T12:00:00Z')
  const dow = d.getUTCDay()
  const label = `${d.getUTCMonth() + 1}/${d.getUTCDate()}(${DAY_LABELS[dow]})`
  return { label, dow }
}

export function ShiftGrid({
  employees,
  dates,
  requestedDaysOff,
  initialShifts,
  lockedDates,
  startDate,
  today,
}: ShiftGridProps) {
  const lockedSet = new Set(lockedDates)
  const tomorrow = (() => {
    const d = new Date(today + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() + 1)
    return d.toISOString().slice(0, 10)
  })()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeCell, setActiveCell] = useState<string | null>(null)

  const [optimisticMap, applyOptimistic] = useOptimistic(
    toShiftMap(initialShifts),
    (current: ShiftMap, action: { key: string; shift: Shift | null }) => {
      const next = { ...current }
      if (action.shift === null) {
        delete next[action.key]
      } else {
        next[action.key] = action.shift
      }
      return next
    },
  )

  const requestedByEmployee = new Map<string, { start_date: string; end_date: string }[]>()
  for (const r of requestedDaysOff) {
    if (!requestedByEmployee.has(r.employee_id)) requestedByEmployee.set(r.employee_id, [])
    requestedByEmployee.get(r.employee_id)!.push(r)
  }

  function isRecurringOff(emp: Employee, date: string): boolean {
    const dow = new Date(date + 'T12:00:00Z').getUTCDay()
    return emp.recurring_days_off.some((r) => r.day_of_week === dow)
  }

  function isRequestedOff(empId: string, date: string): boolean {
    return (requestedByEmployee.get(empId) ?? []).some(
      (r) => r.start_date <= date && date <= r.end_date,
    )
  }

  async function handleLock(date: string) {
    startTransition(async () => {
      const result = await lockDate(date)
      if (result.error) alert(result.error)
      else router.refresh()
    })
  }

  async function handleUnlock(date: string) {
    startTransition(async () => {
      const result = await unlockDate(date)
      if (result.error) alert(result.error)
      else router.refresh()
    })
  }

  async function handleSelect(empId: string, date: string, value: string | 'off' | 'clear') {
    const key = `${empId}:${date}`
    setActiveCell(null)

    startTransition(async () => {
      if (value === 'clear') {
        applyOptimistic({ key, shift: null })
        const result = await deleteShift(empId, date)
        if (result.error) alert(result.error)
      } else if (value === 'off') {
        const optimistic: Shift = {
          id: '',
          employee_id: empId,
          shift_date: date,
          start_time: null,
          is_off: true,
          status: 'draft',
        }
        applyOptimistic({ key, shift: optimistic })
        const result = await upsertShift(empId, date, { isOff: true })
        if (result.error) alert(result.error)
      } else {
        const optimistic: Shift = {
          id: '',
          employee_id: empId,
          shift_date: date,
          start_time: toDbTime(value),
          is_off: false,
          status: 'draft',
        }
        applyOptimistic({ key, shift: optimistic })
        const result = await upsertShift(empId, date, { startTime: toDbTime(value) })
        if (result.error) alert(result.error)
      }
      router.refresh()
    })
  }

  function navigate(direction: 'prev' | 'next') {
    const d = new Date(startDate + 'T12:00:00Z')
    d.setUTCDate(d.getUTCDate() + (direction === 'next' ? 7 : -7))
    router.push(`/shifts?date=${d.toISOString().slice(0, 10)}`)
  }

  function goToDate(offsetDays: number) {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    router.push(`/shifts?date=${d.toISOString().slice(0, 10)}`)
  }

  const activeParts = activeCell ? activeCell.split(':') : null
  const activeEmpId = activeParts ? activeParts[0] : null
  const activeDate = activeParts ? activeParts.slice(1).join(':') : null
  const activeEmp = activeEmpId ? employees.find((e) => e.id === activeEmpId) : null
  const activeShift = activeCell ? optimisticMap[activeCell] ?? null : null

  return (
    <div className="space-y-3">
      {/* Navigation */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => navigate('prev')}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          ← Prev week
        </button>
        <button
          onClick={() => goToDate(0)}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          Today
        </button>
        <button
          onClick={() => goToDate(1)}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          Tomorrow
        </button>
        <button
          onClick={() => navigate('next')}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
        >
          Next week →
        </button>
        {isPending && <span className="text-xs text-zinc-400">Saving…</span>}
      </div>

      {/* Grid */}
      <div className="overflow-auto rounded border border-zinc-200">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 min-w-28 border-b border-r border-zinc-200 bg-white px-3 py-2 text-left text-xs font-medium text-zinc-500">
                Employee
              </th>
              {dates.map((date) => {
                const { label, dow } = formatDateHeader(date)
                const color =
                  dow === 0
                    ? 'text-red-500'
                    : dow === 6
                      ? 'text-blue-500'
                      : 'text-zinc-700'
                const isLocked = lockedSet.has(date)
                const isEditableDate = date === today || date === tomorrow
                const isPast = date < today
                return (
                  <th
                    key={date}
                    className={`sticky top-0 z-10 min-w-24 border-b border-r border-zinc-200 px-2 py-2 text-center text-xs font-medium whitespace-nowrap ${isLocked ? 'bg-zinc-50' : 'bg-white'}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className={color}>{label}</span>
                      {isLocked && !isPast ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUnlock(date)}
                            disabled={isPending}
                            className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-xs text-zinc-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                          >
                            🔒 Unlock
                          </button>
                          <a
                            href={`shortcuts://run-shortcut?name=${encodeURIComponent('シフトSMS送信')}&input=text&text=${date}`}
                            className="rounded bg-emerald-600 px-1.5 py-0.5 text-xs text-white hover:bg-emerald-500"
                          >
                            📱 SMS
                          </a>
                        </div>
                      ) : isEditableDate && !isLocked ? (
                        <button
                          onClick={() => handleLock(date)}
                          disabled={isPending}
                          className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-white hover:bg-zinc-600 disabled:opacity-50"
                        >
                          Confirm
                        </button>
                      ) : null}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="sticky left-0 z-10 border-b border-r border-zinc-200 bg-white px-3 py-2">
                  <div className="font-medium text-zinc-900">{emp.name}</div>
                  {emp.weekly_hour_limit != null && (
                    <div className="text-xs text-zinc-400">{emp.weekly_hour_limit}h/wk</div>
                  )}
                </td>
                {dates.map((date) => {
                  const key = `${emp.id}:${date}`
                  const shift = optimisticMap[key] ?? null
                  const recurringOff = isRecurringOff(emp, date)
                  const requestedOff = isRequestedOff(emp.id, date)
                  const isActive = activeCell === key
                  const isLocked = lockedSet.has(date)
                  const isEditable = (date === today || date === tomorrow) && !isLocked

                  let bgClass = 'bg-white'
                  if (recurringOff) bgClass = 'bg-zinc-100'
                  else if (requestedOff) bgClass = isEditable ? 'bg-blue-50 hover:bg-blue-100' : 'bg-blue-50'
                  else if (isEditable) bgClass = 'bg-white hover:bg-zinc-50'

                  return (
                    <td
                      key={date}
                      className={`border-b border-r border-zinc-200 px-1 py-1 text-center ${bgClass} ${isActive ? 'ring-2 ring-inset ring-zinc-400' : ''}`}
                    >
                      <button
                        onClick={() => isEditable && !recurringOff && setActiveCell(isActive ? null : key)}
                        disabled={!isEditable || recurringOff || isPending}
                        className="flex h-8 w-full items-center justify-center rounded text-xs disabled:cursor-default"
                      >
                        {shift ? (
                          shift.is_off ? (
                            <span className={`font-medium ${isEditable ? 'text-red-500' : 'text-red-300'}`}>Off</span>
                          ) : (
                            <span className={`font-medium ${isEditable ? 'text-zinc-900' : 'text-zinc-400'}`}>
                              {formatTime(shift.start_time!)}
                            </span>
                          )
                        ) : recurringOff ? (
                          <span className="text-zinc-300">—</span>
                        ) : requestedOff ? (
                          <span className="text-blue-300 text-xs">T/O</span>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-zinc-200 bg-zinc-100" />
          Fixed day off
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-blue-100 bg-blue-50" />
          Time off requested
        </span>
      </div>

      {/* Bottom panel for cell editing */}
      {activeCell && activeEmp && activeDate && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setActiveCell(null)}
            aria-hidden="true"
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white p-4 shadow-2xl">
            <div className="mx-auto max-w-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-900">
                  {activeEmp.name}
                  <span className="ml-2 font-normal text-zinc-500">
                    {formatDateHeader(activeDate).label}
                  </span>
                </span>
                <button
                  onClick={() => setActiveCell(null)}
                  className="text-sm text-zinc-400 hover:text-zinc-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {PRESET_TIMES.map((t) => {
                  const isSelected =
                    activeShift !== null &&
                    !activeShift.is_off &&
                    activeShift.start_time !== null &&
                    formatTime(activeShift.start_time) === t
                  const isManagerDefault =
                    activeShift === null && activeEmp.is_manager && t === '9:00'
                  return (
                    <button
                      key={t}
                      onClick={() => handleSelect(activeEmp.id, activeDate, t)}
                      className={`rounded border py-2 text-sm font-medium transition-colors ${
                        isSelected
                          ? 'border-zinc-900 bg-zinc-900 text-white'
                          : isManagerDefault
                            ? 'border-zinc-400 bg-zinc-100'
                            : 'border-zinc-300 hover:bg-zinc-50'
                      }`}
                    >
                      {t}
                    </button>
                  )
                })}
                <button
                  onClick={() => handleSelect(activeEmp.id, activeDate, 'off')}
                  className={`rounded border py-2 text-sm font-medium transition-colors ${
                    activeShift?.is_off
                      ? 'border-red-600 bg-red-600 text-white'
                      : 'border-red-300 text-red-600 hover:bg-red-50'
                  }`}
                >
                  Off
                </button>
                {activeShift && (
                  <button
                    onClick={() => handleSelect(activeEmp.id, activeDate, 'clear')}
                    className="rounded border border-zinc-200 py-2 text-sm text-zinc-400 hover:bg-zinc-50"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
