import { describe, expect, it } from 'vitest'

import { CASE_LIBRARY, validateCaseDefinition } from './cases'

describe('case library', () => {
  it('ships twelve authored cases', () => {
    expect(CASE_LIBRARY).toHaveLength(12)
  })

  it('keeps an even band distribution', () => {
    const counts = CASE_LIBRARY.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.band] = (accumulator[item.band] ?? 0) + 1
      return accumulator
    }, {})

    expect(counts).toEqual({
      beginner: 4,
      intermediate: 4,
      advanced: 4,
    })
  })

  it('validates every case schema', () => {
    const issues = CASE_LIBRARY.flatMap((item) => validateCaseDefinition(item))
    expect(issues).toEqual([])
  })
})
