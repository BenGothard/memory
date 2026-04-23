import { describe, expect, it } from 'vitest'

import { CASE_LIBRARY } from '../content/cases'
import { buildRoundResult, confidenceCalibration } from './scoring'
import type { MatchMetrics } from './types'

const metrics: MatchMetrics = {
  visual: {
    hits: 4,
    misses: 1,
    falseAlarms: 0,
    correctRejections: 3,
    accuracy: 0.875,
  },
  semantic: {
    hits: 3,
    misses: 1,
    falseAlarms: 1,
    correctRejections: 3,
    accuracy: 0.75,
  },
  combinedAccuracy: 0.8125,
  averageLatencyMs: 540,
}

describe('round scoring', () => {
  it('rewards calibrated confidence', () => {
    expect(confidenceCalibration(82, true)).toBeGreaterThan(0.9)
    expect(confidenceCalibration(82, false)).toBeLessThan(0.5)
  })

  it('produces a deterministic round result', () => {
    const caseDefinition = CASE_LIBRARY[0]
    const result = buildRoundResult(
      caseDefinition,
      metrics,
      caseDefinition.inference.correctOptionId,
      82,
    )

    expect(result.inferenceCorrect).toBe(true)
    expect(result.recommendedNextFocus).toBe('flexibility')
    expect(result.score).toBeGreaterThanOrEqual(80)
  })
})
