import Link from 'next/link'
import { EmployeeForm } from '@/components/features/employee-form'
import { createEmployee } from '../actions'

export default function NewEmployeePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/employees" className="text-sm text-zinc-500 hover:text-zinc-700">
          ← 従業員一覧
        </Link>
        <h1 className="text-2xl font-bold">従業員を追加</h1>
      </div>
      <div className="max-w-lg">
        <EmployeeForm action={createEmployee} />
      </div>
    </div>
  )
}
