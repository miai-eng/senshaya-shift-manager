export type TemplateVars = {
  date?: string
  time?: string
}

export type Segment = { kind: 'text'; value: string } | { kind: 'placeholder'; name: string }

export function parseSegments(template: string): Segment[] {
  const segments: Segment[] = []
  const regex = /\\([\\{}])|(\{[a-z][a-z0-9_]*\})/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(template)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: 'text', value: template.slice(lastIndex, match.index) })
    }
    if (match[1] !== undefined) {
      segments.push({ kind: 'text', value: match[1] })
    } else {
      segments.push({ kind: 'placeholder', name: match[2].slice(1, -1) })
    }
    lastIndex = regex.lastIndex
  }

  if (lastIndex < template.length) {
    segments.push({ kind: 'text', value: template.slice(lastIndex) })
  }

  return segments
}

/**
 * テンプレート文字列を変数で置換する。
 * - 未定義変数（vars に無い、または値が null/undefined）は原文のまま残す。
 * - \{ \} \\ のエスケープを処理する。
 * 仕様: docs/template-spec.md
 */
export function renderTemplate(template: string, vars: TemplateVars): string {
  return template.replace(
    /\\([\\{}])|(\{[a-z][a-z0-9_]*\})/g,
    (match, escaped: string | undefined, placeholder: string | undefined) => {
      if (escaped !== undefined) return escaped
      const key = placeholder!.slice(1, -1)
      const value = vars[key as keyof TemplateVars]
      return value != null ? value : placeholder!
    },
  )
}
