// +1 から始まる11桁（スペース除去済みの値を渡すこと）
const CANADIAN_PHONE_RE = /^\+1\d{10}$/

export function validatePhone(phone: string): string | null {
  if (!CANADIAN_PHONE_RE.test(phone)) {
    return 'E.164形式で入力してください（例: +16041234567）'
  }
  return null
}
