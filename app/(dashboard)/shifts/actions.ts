'use server'

import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertShift(
  employeeId: string,
  shiftDate: string,
  payload: { startTime: string; note: string | null } | { isOff: true },
): Promise<{ error?: string }> {
  await requireManager()

  const supabase = await createClient()
  const row = {
    employee_id: employeeId,
    shift_date: shiftDate,
    is_off: 'isOff' in payload,
    start_time: 'isOff' in payload ? null : payload.startTime,
    note: 'isOff' in payload ? null : payload.note,
    status: 'draft',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('shifts')
    .upsert(row, { onConflict: 'employee_id,shift_date' })

  if (error) return { error: 'Failed to save' }

  revalidatePath('/shifts')
  return {}
}

export async function lockDate(shiftDate: string): Promise<{ error?: string }> {
  await requireManager()

  const supabase = await createClient()

  // Managers default to a 9:00 shift. Materialize the default for any manager
  // who has no shift entry and no requested/recurring day off on this date,
  // so the confirmed schedule always reflects it. Manual entries (including
  // Off) and time off always take precedence — they are never overwritten.
  const dayOfWeek = new Date(shiftDate + 'T12:00:00Z').getUTCDay()
  const [
    { data: managers, error: managersError },
    { data: existingShifts, error: shiftsError },
    { data: requestedOff, error: requestedError },
    { data: recurringOff, error: recurringError },
  ] = await Promise.all([
    supabase.from('employees').select('id').eq('is_manager', true).eq('is_active', true),
    supabase.from('shifts').select('employee_id').eq('shift_date', shiftDate),
    supabase
      .from('requested_days_off')
      .select('employee_id')
      .lte('start_date', shiftDate)
      .gte('end_date', shiftDate),
    supabase.from('recurring_days_off').select('employee_id').eq('day_of_week', dayOfWeek),
  ])

  if (managersError || shiftsError || requestedError || recurringError) {
    return { error: 'Failed to confirm' }
  }

  const skipIds = new Set([
    ...(existingShifts ?? []).map((s) => s.employee_id as string),
    ...(requestedOff ?? []).map((r) => r.employee_id as string),
    ...(recurringOff ?? []).map((r) => r.employee_id as string),
  ])

  const defaultRows = (managers ?? [])
    .filter((m) => !skipIds.has(m.id as string))
    .map((m) => ({
      employee_id: m.id as string,
      shift_date: shiftDate,
      is_off: false,
      start_time: '09:00:00',
      note: null,
      status: 'draft',
      updated_at: new Date().toISOString(),
    }))

  if (defaultRows.length > 0) {
    const { error: insertError } = await supabase.from('shifts').insert(defaultRows)
    if (insertError) return { error: 'Failed to confirm' }
  }

  const { error } = await supabase
    .from('shift_locks')
    .upsert({ shift_date: shiftDate }, { onConflict: 'shift_date' })

  if (error) return { error: 'Failed to confirm' }

  revalidatePath('/shifts')
  return {}
}

export async function unlockDate(shiftDate: string): Promise<{ error?: string }> {
  await requireManager()

  const supabase = await createClient()
  const { error } = await supabase.from('shift_locks').delete().eq('shift_date', shiftDate)

  if (error) return { error: 'Failed to unlock' }

  revalidatePath('/shifts')
  return {}
}

export async function deleteShift(
  employeeId: string,
  shiftDate: string,
): Promise<{ error?: string }> {
  await requireManager()

  const supabase = await createClient()
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('employee_id', employeeId)
    .eq('shift_date', shiftDate)

  if (error) return { error: 'Failed to delete' }

  revalidatePath('/shifts')
  return {}
}
