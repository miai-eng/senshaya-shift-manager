import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { DaysOffForm } from '@/components/features/days-off-form'
import { updateDaysOff } from '../../actions'

export default async function EditDaysOffPage({ params }: { params: Promise<{ id: string }> }) {
  await requireManager()

  const { id } = await params
  const supabase = await createClient()

  const [{ data: daysOff }, { data: employees }] = await Promise.all([
    supabase
      .from('requested_days_off')
      .select('id, employee_id, start_date, end_date, reason')
      .eq('id', id)
      .single(),
    supabase.from('employees').select('id, name').eq('is_active', true).order('display_order').order('name'),
  ])

  if (!daysOff) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/days-off" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Time Off
        </Link>
        <h1 className="text-2xl font-bold">Edit Time Off</h1>
      </div>
      <div className="max-w-lg">
        <DaysOffForm action={updateDaysOff} employees={employees ?? []} defaultValues={daysOff} />
      </div>
    </div>
  )
}
