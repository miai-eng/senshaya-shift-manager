import { describe, expect, it } from 'vitest'
import { renderTemplate } from './render-template'

describe('renderTemplate', () => {
  describe('variable substitution', () => {
    it('substitutes {date}', () => {
      expect(renderTemplate('Tomorrow {date} is your day off', { date: 'Apr 26 (Sun)' })).toBe(
        'Tomorrow Apr 26 (Sun) is your day off',
      )
    })

    it('substitutes {time}', () => {
      expect(
        renderTemplate('{date} starts at {time}', { date: 'Apr 26 (Sun)', time: '9:00' }),
      ).toBe('Apr 26 (Sun) starts at 9:00')
    })

    it('leaves variables absent from vars as-is', () => {
      expect(renderTemplate('Today is {undefined_var}', {})).toBe('Today is {undefined_var}')
    })

    it('leaves variables with undefined values as-is', () => {
      expect(renderTemplate('{date} starts at {time}', { date: 'Apr 26 (Sun)' })).toBe(
        'Apr 26 (Sun) starts at {time}',
      )
    })
  })

  describe('escaping', () => {
    it('converts \\{ to {', () => {
      expect(renderTemplate('\\{date\\}', { date: 'Apr 26 (Sun)' })).toBe('{date}')
    })

    it('converts \\\\ to \\', () => {
      expect(renderTemplate('path\\\\file', {})).toBe('path\\file')
    })

    it('does not substitute escaped variables', () => {
      expect(renderTemplate('\\{date\\} and {date}', { date: 'Apr 26 (Sun)' })).toBe(
        '{date} and Apr 26 (Sun)',
      )
    })
  })

  describe('sample templates', () => {
    it('renders the attendance template correctly', () => {
      expect(
        renderTemplate('明日 {date} は {time} からです', { date: '4月26日(日)', time: '9:00' }),
      ).toBe('明日 4月26日(日) は 9:00 からです')
    })

    it('renders the day-off template correctly', () => {
      expect(renderTemplate('明日 {date} はお休みです', { date: '4月26日(日)' })).toBe(
        '明日 4月26日(日) はお休みです',
      )
    })
  })

  describe('edge cases', () => {
    it('returns an empty template as-is', () => {
      expect(renderTemplate('', {})).toBe('')
    })

    it('returns a string with no variables as-is', () => {
      expect(renderTemplate('plain text with no variables', {})).toBe(
        'plain text with no variables',
      )
    })

    it('passes line breaks in the template body through to the output', () => {
      expect(renderTemplate('line 1\nline 2 {date}', { date: 'Apr 26 (Sun)' })).toBe(
        'line 1\nline 2 Apr 26 (Sun)',
      )
    })
  })
})
