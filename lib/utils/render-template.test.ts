import { describe, expect, it } from 'vitest'
import { renderTemplate } from './render-template'

describe('renderTemplate', () => {
  describe('変数置換', () => {
    it('{date} を置換する', () => {
      expect(renderTemplate('明日 {date} はお休みです', { date: '4月26日(日)' })).toBe(
        '明日 4月26日(日) はお休みです',
      )
    })

    it('{time} を置換する', () => {
      expect(
        renderTemplate('{date} は {time} からです', { date: '4月26日(日)', time: '9:00' }),
      ).toBe('4月26日(日) は 9:00 からです')
    })

    it('vars にない変数は原文のまま残す', () => {
      expect(renderTemplate('今日は {undefined_var} です', {})).toBe('今日は {undefined_var} です')
    })

    it('値が undefined の変数は原文のまま残す', () => {
      expect(renderTemplate('{date} は {time} からです', { date: '4月26日(日)' })).toBe(
        '4月26日(日) は {time} からです',
      )
    })
  })

  describe('エスケープ', () => {
    it('\\{ を { に変換する', () => {
      expect(renderTemplate('\\{date\\}', { date: '4月26日(日)' })).toBe('{date}')
    })

    it('\\\\ を \\ に変換する', () => {
      expect(renderTemplate('path\\\\file', {})).toBe('path\\file')
    })

    it('エスケープされた変数は置換しない', () => {
      expect(renderTemplate('\\{date\\} と {date}', { date: '4月26日(日)' })).toBe(
        '{date} と 4月26日(日)',
      )
    })
  })

  describe('サンプルテンプレート', () => {
    it('出勤時テンプレートを正しく置換する', () => {
      expect(
        renderTemplate('明日 {date} は {time} からです', { date: '4月26日(日)', time: '9:00' }),
      ).toBe('明日 4月26日(日) は 9:00 からです')
    })

    it('休みテンプレートを正しく置換する', () => {
      expect(renderTemplate('明日 {date} はお休みです', { date: '4月26日(日)' })).toBe(
        '明日 4月26日(日) はお休みです',
      )
    })
  })

  describe('エッジケース', () => {
    it('空文字テンプレートはそのまま返す', () => {
      expect(renderTemplate('', {})).toBe('')
    })

    it('変数のない文字列はそのまま返す', () => {
      expect(renderTemplate('変数なしのテキスト', {})).toBe('変数なしのテキスト')
    })

    it('テンプレート本文中の改行はそのまま出力する', () => {
      expect(renderTemplate('1行目\n2行目 {date}', { date: '4月26日(日)' })).toBe(
        '1行目\n2行目 4月26日(日)',
      )
    })
  })
})
