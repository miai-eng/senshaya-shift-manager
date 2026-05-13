export type TemplateVars = {
  date?: string
  time?: string
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
