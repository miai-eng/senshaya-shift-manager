import Link from 'next/link'
import { requireManager } from '@/lib/auth/manager'

export default async function DashboardPage() {
  const manager = await requireManager()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-zinc-900">ようこそ、{manager.name} さん。</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/employees" className="rounded border border-zinc-200 p-4 hover:bg-zinc-50">
          <div className="font-semibold">従業員管理</div>
          <div className="mt-1 text-sm text-zinc-500">従業員の追加・編集・アーカイブ</div>
        </Link>
        <Link href="/days-off" className="rounded border border-zinc-200 p-4 hover:bg-zinc-50">
          <div className="font-semibold">リクエストオフ管理</div>
          <div className="mt-1 text-sm text-zinc-500">従業員のオフ期間を登録・管理する</div>
        </Link>
        <Link
          href="/settings/templates"
          className="rounded border border-zinc-200 p-4 hover:bg-zinc-50"
        >
          <div className="font-semibold">テンプレート設定</div>
          <div className="mt-1 text-sm text-zinc-500">シフト連絡の定型文を編集する</div>
        </Link>
      </div>
    </div>
  )
}
