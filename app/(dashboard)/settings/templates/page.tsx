import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { updateTemplate } from './actions'

const TEMPLATE_LABELS: Record<string, string> = {
  attend: '出勤時テンプレート',
  off: '休みテンプレート',
}

const TEMPLATE_HINTS: Record<string, string[]> = {
  attend: ['{date}', '{time}'],
  off: ['{date}'],
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_type: 'テンプレートの種類が不正です。',
  empty_body: 'テンプレート本文を入力してください。',
  save_failed: '保存に失敗しました。時間を置いて再度お試しください。',
}

type Template = {
  type: string
  body: string
}

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>
}) {
  await requireManager()

  const { saved, error } = await searchParams

  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('message_templates')
    .select('type, body')
    .order('type')

  const templateMap = Object.fromEntries((templates ?? []).map((t: Template) => [t.type, t.body]))

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">テンプレート設定</h1>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.save_failed}
        </div>
      )}

      {saved && TEMPLATE_LABELS[saved] && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {TEMPLATE_LABELS[saved]}を保存しました。
        </div>
      )}

      <div className="space-y-6">
        {(['attend', 'off'] as const).map((type) => (
          <div key={type} className="space-y-3 rounded border border-zinc-200 p-4">
            <h2 className="font-semibold">{TEMPLATE_LABELS[type]}</h2>
            <form action={updateTemplate} className="space-y-3">
              <input type="hidden" name="type" value={type} />
              <textarea
                name="body"
                defaultValue={templateMap[type] ?? ''}
                rows={3}
                className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
              />
              <p className="text-xs text-zinc-500">
                利用可能な変数:{' '}
                {TEMPLATE_HINTS[type].map((v) => (
                  <code key={v} className="mr-2 rounded bg-zinc-100 px-1 py-0.5 font-mono">
                    {v}
                  </code>
                ))}
              </p>
              <button
                type="submit"
                className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
              >
                保存する
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  )
}
