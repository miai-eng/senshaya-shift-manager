'use server'

import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type DaysOffState = {
  error?: string
  fieldErrors?: Partial<Record<'employee_id' | 'start_date' | 'end_date', string>>
}

async function checkOverlap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  startDate: string,
  endDate: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from('requested_days_off')
    .select('id')
    .eq('employee_id', employeeId)
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  if (excludeId) query = query.neq('id', excludeId)

  const { data } = await query
  return (data ?? []).length > 0
}

function parseDaysOffForm(formData: FormData): {
  data?: { employee_id: string; start_date: string; end_date: string; reason: string | null }
  errors?: DaysOffState['fieldErrors']
} {
  const employee_id = formData.get('employee_id') as string | null
  const start_date = formData.get('start_date') as string | null
  const end_date = formData.get('end_date') as string | null
  const reason = (formData.get('reason') as string | null)?.trim() || null

  const errors: DaysOffState['fieldErrors'] = {}

  if (!employee_id) errors.employee_id = 'Select an employee'
  if (!start_date) errors.start_date = 'Start date is required'
  if (!end_date) errors.end_date = 'End date is required'
  if (start_date && end_date && end_date < start_date) {
    errors.end_date = 'End date must be on or after start date'
  }

  if (Object.keys(errors).length > 0) return { errors }

  return {
    data: { employee_id: employee_id!, start_date: start_date!, end_date: end_date!, reason },
  }
}

export async function createDaysOff(
  _prevState: DaysOffState,
  formData: FormData,
): Promise<DaysOffState> {
  await requireManager()

  const { data, errors } = parseDaysOffForm(formData)
  if (errors) return { fieldErrors: errors }

  const supabase = await createClient()
  const overlaps = await checkOverlap(supabase, data!.employee_id, data!.start_date, data!.end_date)
  if (overlaps) {
    return {
      fieldErrors: { start_date: 'This period overlaps with an existing time off record' },
    }
  }

  const { error } = await supabase.from('requested_days_off').insert(data!)
  if (error) return { error: 'Failed to save. Please try again later.' }

  revalidatePath('/days-off')
  redirect('/days-off')
}

export async function updateDaysOff(
  _prevState: DaysOffState,
  formData: FormData,
): Promise<DaysOffState> {
  await requireManager()

  const id = formData.get('id') as string
  if (!id) return { error: 'Record ID not found' }

  const { data, errors } = parseDaysOffForm(formData)
  if (errors) return { fieldErrors: errors }

  const supabase = await createClient()
  const overlaps = await checkOverlap(
    supabase,
    data!.employee_id,
    data!.start_date,
    data!.end_date,
    id,
  )
  if (overlaps) {
    return {
      fieldErrors: { start_date: 'This period overlaps with an existing time off record' },
    }
  }

  const { error } = await supabase.from('requested_days_off').update(data!).eq('id', id)
  if (error) return { error: 'Failed to save. Please try again later.' }

  revalidatePath('/days-off')
  redirect('/days-off')
}

export async function deleteDaysOff(formData: FormData): Promise<void> {
  await requireManager()

  const id = formData.get('id') as string
  const supabase = await createClient()
  const { error } = await supabase.from('requested_days_off').delete().eq('id', id)

  if (error) throw new Error('Failed to delete')

  revalidatePath('/days-off')
}
