'use server'

import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
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
    .upsert(
      { type, body: body.trim(), updated_at: new Date().toISOString() },
      { onConflict: 'type' },
    )

  if (error) {
    redirect('/settings/templates?error=save_failed')
  }

  revalidatePath('/settings/templates')
  redirect(`/settings/templates?saved=${type}`)
}
