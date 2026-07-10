import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Manager = {
  id: string
  email: string
  name: string
  role: 'manager' | 'assistant'
}

/**
 * Returns the authenticated user who has a row in public.managers (a manager).
 * - Not logged in: redirect to /login
 * - Logged in but no row in managers: signOut, then redirect to /login?error=not_a_manager
 *
 * Call from Server Components / Server Actions / Route Handlers.
 */
export async function requireManager(): Promise<Manager> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: manager, error } = await supabase
    .from('managers')
    .select('id, email, name, role')
    .eq('id', user.id)
    .single<Manager>()

  if (error || !manager) {
    await supabase.auth.signOut()
    redirect('/login?error=not_a_manager')
  }

  return manager
}
