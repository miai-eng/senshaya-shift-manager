import { describe, expect, it } from 'vitest'
import { validatePhone } from './employee'

describe('validatePhone', () => {
  describe('valid numbers', () => {
    it('accepts a BC number', () => {
      expect(validatePhone('+16042345678')).toBeNull()
    })

    it('accepts an Ontario number', () => {
      expect(validatePhone('+14162345678')).toBeNull()
    })

    it('rejects area codes starting with 0 or 1', () => {
      expect(validatePhone('+11234567890')).not.toBeNull()
    })
  })

  describe('invalid numbers', () => {
    it('rejects a number without +1', () => {
      expect(validatePhone('6041234567')).not.toBeNull()
    })

    it('rejects a number with too few digits', () => {
      expect(validatePhone('+1604123456')).not.toBeNull()
    })

    it('rejects a number with too many digits', () => {
      expect(validatePhone('+160412345678')).not.toBeNull()
    })

    it('rejects an empty string', () => {
      expect(validatePhone('')).not.toBeNull()
    })

    it('rejects a Japanese-format number', () => {
      expect(validatePhone('+819012345678')).not.toBeNull()
    })

    it('rejects a number with remaining spaces (pre-stripped value)', () => {
      expect(validatePhone('+1 604 234 5678')).not.toBeNull()
    })
  })
})
