// NANP-compliant: area code and exchange code must start with 2-9 (pass a value with spaces already stripped)
const CANADIAN_PHONE_RE = /^\+1[2-9]\d{2}[2-9]\d{6}$/

export function validatePhone(phone: string): string | null {
  if (!CANADIAN_PHONE_RE.test(phone)) {
    return 'E.164形式で入力してください（例: +16041234567）'
  }
  return null
}
