export function verifyShortcutToken(request: Request): boolean {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) return false

  const token = authHeader.slice(7)
  const expected = process.env.SHORTCUT_API_TOKEN
  if (!expected) return false

  return token === expected
}
