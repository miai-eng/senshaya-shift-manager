import { requireManager } from '@/lib/auth/manager'
import { createClient } from '@/lib/supabase/server'
import { TemplateForm } from '@/components/features/template-form'
import { updateTemplate } from './actions'

const TEMPLATE_LABELS: Record<string, string> = {
  attend: 'Attendance template',
  off: 'Day off template',
}

const TEMPLATE_HINTS: Record<string, string[]> = {
  attend: ['{date}', '{time}'],
  off: ['{date}'],
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_type: 'Invalid template type.',
  empty_body: 'Template body is required.',
  save_failed: 'Failed to save. Please try again later.',
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
      <h1 className="text-2xl font-bold">Message Templates</h1>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.save_failed}
        </div>
      )}

      {saved && TEMPLATE_LABELS[saved] && (
        <div className="rounded border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {TEMPLATE_LABELS[saved]} saved.
        </div>
      )}

      <div className="space-y-6">
        {(['attend', 'off'] as const).map((type) => (
          <div key={type} className="space-y-3 rounded border border-zinc-200 p-4">
            <h2 className="font-semibold">{TEMPLATE_LABELS[type]}</h2>
            <TemplateForm
              type={type}
              defaultBody={templateMap[type] ?? ''}
              hints={TEMPLATE_HINTS[type]}
              action={updateTemplate}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
