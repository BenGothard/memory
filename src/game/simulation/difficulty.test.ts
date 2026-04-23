import { describe, expect, it } from 'vitest'

import { adaptDifficulty, initialDifficultyForBand } from './difficulty'
import type { RoundResult } from './types'

const baseResult: RoundResult = {
  caseId: 'test',
  accuracy: 0.8,
  misses: 1,
  falseAlarms: 1,
  latencyMs: 480,
  confidence: 78,
  confidenceCalibration: 0.8,
  inferredBiasTags: ['confirmation-bias'],
  recommendedNextFocus: 'flexibility',
  inferenceCorrect: true,
  explanationSummary: 'Strongest evidence.',
  score: 86,
}

describe('difficulty adaptation', () => {
  it('promotes difficulty when both accuracy and calibration are strong', () => {
    const current = initialDifficultyForBand('beginner')
    const next = adaptDifficulty(current, baseResult)

    expect(next.nBackLevel).toBe(2)
    expect(next.frameDurationMs).toBeLessThan(current.frameDurationMs)
    expect(next.caseBand).toBe('intermediate')
  })

  it('demotes difficulty when performance slips', () => {
    const current = initialDifficultyForBand('advanced')
    const next = adaptDifficulty(current, {
      ...baseResult,
      accuracy: 0.42,
      confidenceCalibration: 0.3,
      inferenceCorrect: false,
      score: 35,
    })

    expect(next.nBackLevel).toBe(2)
    expect(next.caseBand).toBe('intermediate')
    expect(next.frameDurationMs).toBeGreaterThan(current.frameDurationMs)
  })
})
