import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { EmployeeForm } from '@/components/features/employee-form'
import { updateEmployee } from '../../actions'

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  await requireManager()

  const { id } = await params
  const supabase = await createClient()

  const [{ data: employee }, { data: recurringDaysOff }] = await Promise.all([
    supabase
      .from('employees')
      .select('id, name, phone, visa_type, weekly_hour_limit, notes, is_manager')
      .eq('id', id)
      .single(),
    supabase.from('recurring_days_off').select('day_of_week').eq('employee_id', id),
  ])

  if (!employee) notFound()

  const offDays = new Set((recurringDaysOff ?? []).map((r) => r.day_of_week))

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/employees" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Employees
        </Link>
        <h1 className="text-2xl font-bold">Edit Employee</h1>
      </div>

      <div className="max-w-lg">
        <EmployeeForm
          action={updateEmployee}
          defaultValues={employee}
          defaultOffDays={[...offDays]}
        />
      </div>
    </div>
  )
}
