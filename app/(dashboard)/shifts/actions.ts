'use server'

import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function upsertShift(
  employeeId: string,
  shiftDate: string,
  payload: { startTime: string } | { isOff: true },
): Promise<{ error?: string }> {
  await requireManager()

  const supabase = await createClient()
  const row =
    'isOff' in payload
      ? {
          employee_id: employeeId,
          shift_date: shiftDate,
          is_off: true,
          start_time: null,
          status: 'draft',
          updated_at: new Date().toISOString(),
        }
      : {
          employee_id: employeeId,
          shift_date: shiftDate,
          is_off: false,
          start_time: payload.startTime,
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

  if (error) return { error: '削除に失敗しました' }

  revalidatePath('/shifts')
  return {}
}
