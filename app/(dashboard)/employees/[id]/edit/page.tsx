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
  const { data: employee } = await supabase
    .from('employees')
    .select('id, name, phone, visa_type, weekly_hour_limit, notes')
    .eq('id', id)
    .single()

  if (!employee) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← 従業員一覧
        </Link>
        <h1 className="text-2xl font-bold">従業員を編集</h1>
      </div>
      <div className="max-w-lg">
        <EmployeeForm action={updateEmployee} defaultValues={employee} />
      </div>
    </div>
  )
}
