import Link from 'next/link'
import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { DaysOffForm } from '@/components/features/days-off-form'
import { createDaysOff } from '../actions'

export default async function NewDaysOffPage() {
  await requireManager()

  const supabase = await createClient()
  const { data: employees } = await supabase
    .from('employees')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/days-off" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Time Off
        </Link>
        <h1 className="text-2xl font-bold">Add Time Off</h1>
      </div>
      <div className="max-w-lg">
        <DaysOffForm action={createDaysOff} employees={employees ?? []} />
      </div>
    </div>
  )
}
