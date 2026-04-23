import type {
  CaseDefinition,
  MatchMetrics,
  PlayerProfile,
  RoundResult,
  SkillFocus,
} from './types'

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function confidenceCalibration(confidence: number, inferenceCorrect: boolean): number {
  const target = inferenceCorrect ? 85 : 25
  return clamp(1 - Math.abs(confidence - target) / 100, 0, 1)
}

export function inferFocus(
  metrics: MatchMetrics,
  inferenceCorrect: boolean,
  calibration: number,
): SkillFocus {
  const falseAlarms = metrics.visual.falseAlarms + metrics.semantic.falseAlarms
  const misses = metrics.visual.misses + metrics.semantic.misses

  if (calibration < 0.55) {
    return 'metacognition'
  }

  if (!inferenceCorrect) {
    return 'evidence-evaluation'
  }

  if (falseAlarms > misses) {
    return 'inhibition'
  }

  if (metrics.combinedAccuracy < 0.7) {
    return 'working-memory'
  }

  return 'flexibility'
}

export function buildRoundResult(
  caseDefinition: CaseDefinition,
  metrics: MatchMetrics,
  selectedOptionId: string,
  confidence: number,
): RoundResult {
  const inferenceCorrect = selectedOptionId === caseDefinition.inference.correctOptionId
  const calibration = confidenceCalibration(confidence, inferenceCorrect)
  const misses = metrics.visual.misses + metrics.semantic.misses
  const falseAlarms = metrics.visual.falseAlarms + metrics.semantic.falseAlarms
  const inferredBiasTags = inferenceCorrect
    ? caseDefinition.biasTags.slice(0, 1)
    : caseDefinition.biasTags.slice(0, 2)
  const recommendedNextFocus = inferFocus(metrics, inferenceCorrect, calibration)
  const score = Math.round(
    metrics.combinedAccuracy * 55 +
      (inferenceCorrect ? 25 : 0) +
      calibration * 20,
  )

  return {
    caseId: caseDefinition.id,
    accuracy: metrics.combinedAccuracy,
    misses,
    falseAlarms,
    latencyMs: Math.round(metrics.averageLatencyMs),
    confidence,
    confidenceCalibration: calibration,
    inferredBiasTags,
    recommendedNextFocus,
    inferenceCorrect,
    explanationSummary: caseDefinition.inference.strongestEvidence,
    score,
  }
}

export function updateProfileAfterRound(
  profile: PlayerProfile,
  caseDefinition: CaseDefinition,
  result: RoundResult,
  coachingSummary: string,
  elapsedMinutes: number,
): PlayerProfile {
  const previousMastery = profile.caseMastery[caseDefinition.id] ?? {
    plays: 0,
    bestScore: 0,
    lastPlayedAt: new Date(0).toISOString(),
  }
  const commonReasoningErrors = Array.from(
    new Set([...result.inferredBiasTags, ...profile.commonReasoningErrors]),
  ).slice(0, 5)
  const coachingHistorySummary = [coachingSummary, ...profile.coachingHistorySummary].slice(0, 6)

  return {
    ...profile,
    streak: result.score >= 70 ? profile.streak + 1 : 0,
    weeklyMinutes: profile.weeklyMinutes + elapsedMinutes,
    commonReasoningErrors,
    caseMastery: {
      ...profile.caseMastery,
      [caseDefinition.id]: {
        plays: previousMastery.plays + 1,
        bestScore: Math.max(previousMastery.bestScore, result.score),
        lastPlayedAt: new Date().toISOString(),
      },
    },
    coachingHistorySummary,
    totalRounds: profile.totalRounds + 1,
    totalPlayMinutes: profile.totalPlayMinutes + elapsedMinutes,
  }
}
