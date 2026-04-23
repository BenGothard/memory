import type { CaseBand, DifficultyState, PlayerProfile, RoundResult } from './types'

const BASE_THRESHOLDS = {
  promoteAccuracy: 0.78,
  promoteCalibration: 0.62,
  demoteAccuracy: 0.55,
  demoteCalibration: 0.4,
}

function nextBand(band: CaseBand): CaseBand {
  if (band === 'beginner') {
    return 'intermediate'
  }

  if (band === 'intermediate') {
    return 'advanced'
  }

  return 'advanced'
}

function previousBand(band: CaseBand): CaseBand {
  if (band === 'advanced') {
    return 'intermediate'
  }

  return 'beginner'
}

export function initialDifficultyForBand(band: CaseBand): DifficultyState {
  switch (band) {
    case 'advanced':
      return {
        nBackLevel: 3,
        frameDurationMs: 1350,
        distractorRate: 0.28,
        caseBand: 'advanced',
        evidenceWindow: 6,
        ambiguity: 0.75,
        thresholds: BASE_THRESHOLDS,
      }
    case 'intermediate':
      return {
        nBackLevel: 2,
        frameDurationMs: 1500,
        distractorRate: 0.2,
        caseBand: 'intermediate',
        evidenceWindow: 5,
        ambiguity: 0.52,
        thresholds: BASE_THRESHOLDS,
      }
    default:
      return {
        nBackLevel: 1,
        frameDurationMs: 1700,
        distractorRate: 0.14,
        caseBand: 'beginner',
        evidenceWindow: 4,
        ambiguity: 0.3,
        thresholds: BASE_THRESHOLDS,
      }
  }
}

export function adaptDifficulty(
  current: DifficultyState,
  result: RoundResult,
): DifficultyState {
  const shouldPromote =
    result.accuracy >= current.thresholds.promoteAccuracy &&
    result.confidenceCalibration >= current.thresholds.promoteCalibration &&
    result.inferenceCorrect

  const shouldDemote =
    result.accuracy <= current.thresholds.demoteAccuracy ||
    result.confidenceCalibration <= current.thresholds.demoteCalibration

  if (shouldPromote) {
    return {
      ...current,
      nBackLevel: Math.min(current.nBackLevel + 1, 4),
      frameDurationMs: Math.max(current.frameDurationMs - 120, 980),
      distractorRate: Math.min(current.distractorRate + 0.05, 0.42),
      evidenceWindow: Math.min(current.evidenceWindow + 1, 7),
      ambiguity: Math.min(current.ambiguity + 0.1, 1),
      caseBand: nextBand(current.caseBand),
    }
  }

  if (shouldDemote) {
    return {
      ...current,
      nBackLevel: Math.max(current.nBackLevel - 1, 1),
      frameDurationMs: Math.min(current.frameDurationMs + 110, 1900),
      distractorRate: Math.max(current.distractorRate - 0.04, 0.08),
      evidenceWindow: Math.max(current.evidenceWindow - 1, 4),
      ambiguity: Math.max(current.ambiguity - 0.08, 0.2),
      caseBand: previousBand(current.caseBand),
    }
  }

  return current
}

export function unlockBandForProfile(
  profile: PlayerProfile,
  nextDifficulty: DifficultyState,
): CaseBand {
  if (
    profile.unlockedBand === 'beginner' &&
    nextDifficulty.caseBand !== 'beginner' &&
    profile.totalRounds >= 2
  ) {
    return 'intermediate'
  }

  if (
    profile.unlockedBand !== 'advanced' &&
    nextDifficulty.caseBand === 'advanced' &&
    profile.totalRounds >= 5
  ) {
    return 'advanced'
  }

  return profile.unlockedBand
}
