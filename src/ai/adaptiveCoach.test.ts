import { describe, expect, it } from 'vitest'

import { CASE_LIBRARY } from '../game/content/cases'
import { AdaptiveCoachManager } from './adaptiveCoach'
import type { CoachPayload } from '../game/simulation/types'

const payload: CoachPayload = {
  caseDefinition: CASE_LIBRARY[0],
  result: {
    caseId: CASE_LIBRARY[0].id,
    accuracy: 0.61,
    misses: 3,
    falseAlarms: 2,
    latencyMs: 610,
    confidence: 84,
    confidenceCalibration: 0.28,
    inferredBiasTags: ['anecdotal-bias'],
    recommendedNextFocus: 'metacognition',
    inferenceCorrect: false,
    explanationSummary: CASE_LIBRARY[0].inference.strongestEvidence,
    score: 48,
  },
  profile: {
    streak: 0,
    weeklyMinutes: 0,
    unlockedBand: 'beginner',
    commonReasoningErrors: [],
    caseMastery: {},
    savedSettings: {
      aiPreference: 'chrome',
      reducedMotion: false,
      audioEnabled: true,
    },
    coachingHistorySummary: [],
    totalRounds: 0,
    totalPlayMinutes: 0,
  },
  explanation: 'I trusted the forum anecdote too quickly.',
  confidence: 84,
}

describe('adaptive coach manager', () => {
  it('falls back to the rule coach when Chrome AI is unavailable', async () => {
    Reflect.deleteProperty(window, 'LanguageModel')
    window.ai = undefined

    const manager = new AdaptiveCoachManager('chrome')
    const status = await manager.getStatus()
    const response = await manager.coach(payload)

    expect(status).toEqual({
      availability: 'fallback',
      resolvedMode: 'rule',
    })
    expect(response.mode).toBe('rule')
  })
})
