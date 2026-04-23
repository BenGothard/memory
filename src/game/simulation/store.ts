import { AdaptiveCoachManager } from '../../ai/adaptiveCoach'
import { CASE_LIBRARY } from '../content/cases'
import { adaptDifficulty, initialDifficultyForBand, unlockBandForProfile } from './difficulty'
import { createMatchFrames, registerMatchAttempt, summarizeMatchFrames } from './match'
import { buildRoundResult, updateProfileAfterRound } from './scoring'
import {
  createBrowserStorage,
  loadProfile,
  saveProfile,
  type StorageLike,
} from './storage'
import type {
  AiPreference,
  CaseBand,
  CaseDefinition,
  CurrentRoundState,
  GameState,
  MatchChannel,
  SessionState,
} from './types'

type Listener = (state: GameState) => void

function cloneCaseSelection(pool: CaseDefinition[], offset: number): CaseDefinition[] {
  return pool.map((_, index) => pool[(index + offset) % pool.length])
}

function casePlanForBand(band: CaseBand): CaseBand[] {
  if (band === 'advanced') {
    return ['intermediate', 'advanced', 'advanced']
  }

  if (band === 'intermediate') {
    return ['beginner', 'intermediate', 'intermediate']
  }

  return ['beginner', 'beginner', 'beginner']
}

function selectSessionCases(unlockedBand: CaseBand, offset: number): CaseDefinition[] {
  const plans = casePlanForBand(unlockedBand)
  const counts = new Map<CaseBand, number>()

  return plans.map((band) => {
    const bandPool = cloneCaseSelection(
      CASE_LIBRARY.filter((item) => item.band === band),
      offset,
    )
    const pickIndex = counts.get(band) ?? 0
    counts.set(band, pickIndex + 1)
    return bandPool[pickIndex % bandPool.length]
  })
}

function buildRound(caseDefinition: CaseDefinition, difficulty: SessionState['difficulty']): CurrentRoundState {
  return {
    caseDefinition,
    phase: 'briefing',
    observeCursor: 0,
    matchFrames: createMatchFrames(caseDefinition, difficulty),
    currentMatchIndex: -1,
    reflectionConfidence: 60,
    reflectionText: '',
    startedAt: Date.now(),
  }
}

function estimateRoundMinutes(round: CurrentRoundState): number {
  const elapsed = Math.round((Date.now() - round.startedAt) / 60000)
  return Math.max(elapsed, 5)
}

export class SignalLabStore {
  private readonly listeners = new Set<Listener>()
  private readonly storage: StorageLike
  private readonly aiCoach: AdaptiveCoachManager
  private state: GameState

  constructor(options?: {
    storage?: StorageLike
    aiCoach?: AdaptiveCoachManager
  }) {
    this.storage = options?.storage ?? createBrowserStorage()
    const profile = loadProfile(this.storage)
    this.aiCoach = options?.aiCoach ?? new AdaptiveCoachManager(profile.savedSettings.aiPreference)
    this.state = {
      phase: 'menu',
      aiPreference: profile.savedSettings.aiPreference,
      aiAvailability: 'checking',
      aiModeResolved: 'rule',
      profile,
    }
  }

  getState(): GameState {
    return this.state
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener)
    listener(this.state)
    return () => {
      this.listeners.delete(listener)
    }
  }

  async refreshAiStatus(): Promise<void> {
    this.aiCoach.setPreference(this.state.aiPreference)
    const status = await this.aiCoach.getStatus()
    this.state = {
      ...this.state,
      aiAvailability: status.availability,
      aiModeResolved: status.resolvedMode,
    }
    this.emit()
  }

  async cycleAiPreference(): Promise<void> {
    const order: AiPreference[] = ['auto', 'rule', 'chrome']
    const currentIndex = order.indexOf(this.state.aiPreference)
    const nextPreference = order[(currentIndex + 1) % order.length]
    const nextProfile = {
      ...this.state.profile,
      savedSettings: {
        ...this.state.profile.savedSettings,
        aiPreference: nextPreference,
      },
    }

    this.state = {
      ...this.state,
      aiPreference: nextPreference,
      profile: nextProfile,
    }
    saveProfile(this.storage, nextProfile)
    this.emit()
    await this.refreshAiStatus()
  }

  startSession(): void {
    const difficulty = initialDifficultyForBand(this.state.profile.unlockedBand)
    const offset = this.state.profile.totalRounds % 4
    const selectedCases = selectSessionCases(this.state.profile.unlockedBand, offset)
    const rounds = selectedCases.map((item) => buildRound(item, difficulty))

    this.state = {
      ...this.state,
      phase: 'active',
      session: {
        rounds,
        currentRoundIndex: 0,
        difficulty,
        sessionScore: 0,
        startedAt: Date.now(),
        complete: false,
      },
      lastSummary: undefined,
    }
    this.emit()
  }

  beginObserve(): void {
    const round = this.currentRound()
    if (!round || round.phase !== 'briefing') {
      return
    }

    round.phase = 'observe'
    round.observeCursor = 0
    round.startedAt = Date.now()
    this.emit()
  }

  advanceObserve(): void {
    const round = this.currentRound()
    if (!round || round.phase !== 'observe') {
      return
    }

    if (round.observeCursor < round.caseDefinition.evidenceSequence.length - 1) {
      round.observeCursor += 1
    } else {
      round.phase = 'match'
      round.currentMatchIndex = -1
    }
    this.emit()
  }

  advanceMatchFrame(nowMs: number): boolean {
    const round = this.currentRound()
    if (!round || round.phase !== 'match') {
      return false
    }

    const nextIndex = round.currentMatchIndex + 1
    if (nextIndex >= round.matchFrames.length) {
      round.matchMetrics = summarizeMatchFrames(round.matchFrames)
      round.phase = 'infer'
      this.emit()
      return false
    }

    round.currentMatchIndex = nextIndex
    round.matchFrames[nextIndex].presentedAtMs = nowMs
    this.emit()
    return true
  }

  registerMatchAttempt(channel: MatchChannel, nowMs: number): void {
    const round = this.currentRound()
    if (!round || round.phase !== 'match') {
      return
    }

    const result = registerMatchAttempt(round.matchFrames, round.currentMatchIndex, channel, nowMs)
    if (result.accepted) {
      this.emit()
    }
  }

  submitInference(optionId: string): void {
    const round = this.currentRound()
    if (!round || round.phase !== 'infer') {
      return
    }

    round.inferenceSelectionId = optionId
    round.phase = 'reflect'
    this.emit()
  }

  setReflectionConfidence(confidence: number): void {
    const round = this.currentRound()
    if (!round) {
      return
    }

    round.reflectionConfidence = confidence
  }

  setReflectionText(text: string): void {
    const round = this.currentRound()
    if (!round) {
      return
    }

    round.reflectionText = text
  }

  async submitReflection(): Promise<void> {
    const round = this.currentRound()
    const session = this.state.session
    if (
      !round ||
      !session ||
      round.phase !== 'reflect' ||
      !round.inferenceSelectionId
    ) {
      return
    }

    round.matchMetrics = round.matchMetrics ?? summarizeMatchFrames(round.matchFrames)
    const result = buildRoundResult(
      round.caseDefinition,
      round.matchMetrics,
      round.inferenceSelectionId,
      round.reflectionConfidence,
    )

    round.result = result
    round.phase = 'report'
    round.coach = {
      mode: this.state.aiModeResolved,
      headline: 'Preparing your next-thinking report.',
      bullets: [
        'Checking memory accuracy against the scenario evidence.',
        'Comparing your confidence with the strength of the signal.',
        'Generating a local-first coaching summary.',
      ],
      skillFocus: result.recommendedNextFocus,
      suggestedPrompt: round.caseDefinition.reflectionPrompts[0]?.prompt ?? 'Review the strongest evidence.',
    }
    this.emit()

    const [coach, explanation] = await Promise.all([
      this.aiCoach.coach({
        caseDefinition: round.caseDefinition,
        result,
        profile: this.state.profile,
        explanation: round.reflectionText,
        confidence: round.reflectionConfidence,
      }),
      this.aiCoach.explainInference(round.reflectionText, round.caseDefinition),
    ])

    round.coach = coach
    round.explanation = explanation
    session.sessionScore += result.score

    const updatedProfile = updateProfileAfterRound(
      this.state.profile,
      round.caseDefinition,
      result,
      coach.headline,
      estimateRoundMinutes(round),
    )
    const nextDifficulty = adaptDifficulty(session.difficulty, result)
    const unlockedBand = unlockBandForProfile(updatedProfile, nextDifficulty)
    updatedProfile.unlockedBand = unlockedBand
    this.state = {
      ...this.state,
      profile: updatedProfile,
      session: {
        ...session,
        difficulty: nextDifficulty,
      },
    }
    saveProfile(this.storage, updatedProfile)
    this.emit()
  }

  advanceRound(): void {
    const session = this.state.session
    const round = this.currentRound()
    if (!session || !round?.result) {
      return
    }

    const nextIndex = session.currentRoundIndex + 1
    if (nextIndex >= session.rounds.length) {
      session.complete = true
      this.state = {
        ...this.state,
        phase: 'summary',
        lastSummary: {
          totalScore: session.sessionScore,
          completedCases: session.rounds.length,
          focus: round.result.recommendedNextFocus,
        },
      }
      this.emit()
      return
    }

    const nextCase = session.rounds[nextIndex].caseDefinition
    session.currentRoundIndex = nextIndex
    session.rounds[nextIndex] = buildRound(nextCase, session.difficulty)
    this.emit()
  }

  resetToMenu(): void {
    this.state = {
      ...this.state,
      phase: 'menu',
      session: undefined,
    }
    this.emit()
  }

  private currentRound(): CurrentRoundState | undefined {
    return this.state.session?.rounds[this.state.session.currentRoundIndex]
  }

  private emit(): void {
    for (const listener of this.listeners) {
      listener(this.state)
    }
  }
}
