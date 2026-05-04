'use server'

import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function updateTemplate(formData: FormData): Promise<void> {
  await requireManager()

  const type = formData.get('type')
  const body = formData.get('body')

  if (type !== 'attend' && type !== 'off') {
    redirect('/settings/templates?error=invalid_type')
  }
  if (typeof body !== 'string' || body.trim() === '') {
    redirect('/settings/templates?error=empty_body')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('message_templates')
    .update({ body: body.trim(), updated_at: new Date().toISOString() })
    .eq('type', type)

  if (error) {
    redirect('/settings/templates?error=save_failed')
  }

  redirect(`/settings/templates?saved=${type}`)
}
