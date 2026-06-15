'use client'

import { useState } from 'react'
import { parseSegments, type TemplateVars } from '@/lib/utils/render-template'

const PREVIEW_VARS: TemplateVars = {
  date: '4月26日(日)',
  time: '9:00',
}

interface TemplateFormProps {
  type: 'attend' | 'off'
  defaultBody: string
  hints: string[]
  action: (formData: FormData) => Promise<void>
}

export function TemplateForm({ type, defaultBody, hints, action }: TemplateFormProps) {
  const [body, setBody] = useState(defaultBody)
  const segments = parseSegments(body)

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="type" value={type} />
      <textarea
        name="body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        className="w-full rounded border border-zinc-400 px-3 py-2 text-sm focus:border-zinc-700 focus:outline-none"
      />
      <p className="text-xs text-zinc-500">
        利用可能な変数:{' '}
        {hints.map((v) => (
          <code key={v} className="mr-2 rounded bg-zinc-100 px-1 py-0.5 font-mono">
            {v}
          </code>
        ))}
      </p>

      <div className="space-y-1">
        <p className="text-xs text-zinc-500">プレビュー（サンプル値で表示）</p>
        <div
          aria-label="プレビュー"
          className="min-h-8 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm whitespace-pre-wrap"
        >
          {segments.length === 0 ? (
            <span className="text-zinc-400">テンプレートを入力してください</span>
          ) : (
            segments.map((seg, i) =>
              seg.kind === 'text' ? (
                <span key={i}>{seg.value}</span>
              ) : PREVIEW_VARS[seg.name as keyof TemplateVars] != null ? (
                <span key={i}>{PREVIEW_VARS[seg.name as keyof TemplateVars]}</span>
              ) : (
                <span key={i} className="rounded bg-amber-100 px-0.5 text-amber-700">
                  {`{${seg.name}}`}
                </span>
              )
            )
          )}
        </div>
      </div>

      <button
        type="submit"
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
      >
        保存する
      </button>
    </form>
  )
}
