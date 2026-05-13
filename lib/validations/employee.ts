// カナダ NANP 形式: +1 + 市外局番(2-9始まり) + 市内局番(2-9始まり) + 加入者番号4桁
const CANADIAN_PHONE_RE = /^\+1[2-9]\d{2}[2-9]\d{6}$/

export function validatePhone(phone: string): string | null {
  if (!CANADIAN_PHONE_RE.test(phone)) {
    return 'E.164形式で入力してください（例: +16041234567）'
  }
  return null
}
