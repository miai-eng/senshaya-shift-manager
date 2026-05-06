import { describe, expect, it } from 'vitest'
import { validatePhone } from './employee'

describe('validatePhone', () => {
  describe('有効な番号', () => {
    it('BC州の番号を受け入れる', () => {
      expect(validatePhone('+16042345678')).toBeNull()
    })

    it('オンタリオ州の番号を受け入れる', () => {
      expect(validatePhone('+14162345678')).toBeNull()
    })

    it('1始まり市外局番でも受け入れる', () => {
      expect(validatePhone('+11234567890')).toBeNull()
    })
  })

  describe('無効な番号', () => {
    it('+1 なしは拒否する', () => {
      expect(validatePhone('6041234567')).not.toBeNull()
    })

    it('桁数が足りない番号を拒否する', () => {
      expect(validatePhone('+1604123456')).not.toBeNull()
    })

    it('桁数が多い番号を拒否する', () => {
      expect(validatePhone('+160412345678')).not.toBeNull()
    })

    it('空文字を拒否する', () => {
      expect(validatePhone('')).not.toBeNull()
    })

    it('日本の番号形式を拒否する', () => {
      expect(validatePhone('+819012345678')).not.toBeNull()
    })

    it('スペースが残っている番号を拒否する（除去前の値）', () => {
      expect(validatePhone('+1 604 234 5678')).not.toBeNull()
    })
  })
})
