'use server'

import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { validatePhone } from '@/lib/validations/employee'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export type EmployeeState = {
  error?: string
  fieldErrors?: Partial<Record<'name' | 'phone' | 'weekly_hour_limit', string>>
}

function parseFormData(formData: FormData): {
  data?: {
    name: string
    phone: string
    visa_type: string | null
    weekly_hour_limit: number | null
    notes: string | null
  }
  errors?: EmployeeState['fieldErrors']
} {
  const name = (formData.get('name') as string | null)?.trim()
  const phone = (formData.get('phone') as string | null)?.trim()
  const visa_type = (formData.get('visa_type') as string | null)?.trim() || null
  const weeklyRaw = (formData.get('weekly_hour_limit') as string | null)?.trim()
  const notes = (formData.get('notes') as string | null)?.trim() || null

  const errors: EmployeeState['fieldErrors'] = {}

  if (!name) errors.name = '氏名を入力してください'

  if (!phone) {
    errors.phone = '電話番号を入力してください'
  } else {
    const phoneError = validatePhone(phone)
    if (phoneError) errors.phone = phoneError
  }

  let weekly_hour_limit: number | null = null
  if (weeklyRaw) {
    const parsed = parseInt(weeklyRaw, 10)
    if (isNaN(parsed) || parsed <= 0) {
      errors.weekly_hour_limit = '1以上の整数を入力してください'
    } else {
      weekly_hour_limit = parsed
    }
  }

  if (Object.keys(errors).length > 0) return { errors }

  return { data: { name: name!, phone: phone!, visa_type, weekly_hour_limit, notes } }
}

export async function createEmployee(
  _prevState: EmployeeState,
  formData: FormData,
): Promise<EmployeeState> {
  await requireManager()

  const { data, errors } = parseFormData(formData)
  if (errors) return { fieldErrors: errors }

  const supabase = await createClient()
  const { error } = await supabase.from('employees').insert(data!)

  if (error) return { error: '保存に失敗しました。時間を置いて再度お試しください。' }

  redirect('/employees')
}

export async function updateEmployee(
  _prevState: EmployeeState,
  formData: FormData,
): Promise<EmployeeState> {
  await requireManager()

  const id = formData.get('id') as string
  if (!id) return { error: '従業員IDが見つかりません' }

  const { data, errors } = parseFormData(formData)
  if (errors) return { fieldErrors: errors }

  const supabase = await createClient()
  const { error } = await supabase
    .from('employees')
    .update({ ...data!, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: '保存に失敗しました。時間を置いて再度お試しください。' }

  redirect('/employees')
}

export async function archiveEmployee(formData: FormData): Promise<void> {
  await requireManager()

  const id = formData.get('id') as string
  const supabase = await createClient()
  const { error } = await supabase
    .from('employees')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error('アーカイブに失敗しました')

  revalidatePath('/employees')
}

export async function restoreEmployee(formData: FormData): Promise<void> {
  await requireManager()

  const id = formData.get('id') as string
  const supabase = await createClient()
  const { error } = await supabase
    .from('employees')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new Error('復元に失敗しました')

  revalidatePath('/employees')
}
