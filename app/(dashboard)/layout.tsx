import Link from 'next/link'
import { requireManager } from '@/lib/auth/manager'
import { signOut } from '@/lib/auth/actions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const manager = await requireManager()

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-6 py-3">
        <Link href="/dashboard" className="text-sm font-semibold hover:text-zinc-600">
          Senshaya Shift Manager
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-900">
            {manager.name}
            <span className="ml-2 text-xs text-zinc-700">
              ({manager.role === 'manager' ? 'Manager' : 'Assistant'})
            </span>
          </span>
          <form action={signOut}>
            <button
              type="submit"
              className="rounded border border-zinc-400 px-3 py-1 text-sm hover:bg-zinc-100"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  )
}
