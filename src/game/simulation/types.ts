export type CaseBand = 'beginner' | 'intermediate' | 'advanced'
export type EvidenceQuality = 'strong' | 'mixed' | 'weak'
export type SkillFocus =
  | 'working-memory'
  | 'inhibition'
  | 'flexibility'
  | 'evidence-evaluation'
  | 'metacognition'
export type InferenceKind =
  | 'best-supported'
  | 'missing-evidence'
  | 'counter-hypothesis'
export type MatchChannel = 'visual' | 'semantic'
export type AiPreference = 'auto' | 'rule' | 'chrome'
export type AiAvailability = 'checking' | 'ready' | 'fallback' | 'unavailable'
export type RoundPhase =
  | 'briefing'
  | 'observe'
  | 'match'
  | 'infer'
  | 'reflect'
  | 'report'

export interface SourceCue {
  label: string
  quality: EvidenceQuality
  note: string
}

export interface EvidenceCard {
  id: string
  label: string
  summary: string
  visualToken: string
  semanticToken: string
  variable: string
  numericSignal: string
  source: SourceCue
  tags: string[]
}

export interface InferenceOption {
  id: string
  text: string
  rationale: string
}

export interface InferenceQuestion {
  prompt: string
  kind: InferenceKind
  options: InferenceOption[]
  correctOptionId: string
  strongestEvidence: string
  counterWeight: string
}

export interface ReflectionPrompt {
  id: string
  prompt: string
  placeholder: string
}

export interface CaseDefinition {
  id: string
  band: CaseBand
  title: string
  premise: string
  focus: SkillFocus
  evidenceSequence: EvidenceCard[]
  inference: InferenceQuestion
  reflectionPrompts: ReflectionPrompt[]
  rubricTags: string[]
  biasTags: string[]
}

export interface MatchFrame {
  index: number
  sourceCardId: string
  visualToken: string
  semanticToken: string
  expected: Record<MatchChannel, boolean>
  responded: Record<MatchChannel, boolean>
  latencyMs: Partial<Record<MatchChannel, number>>
  presentedAtMs?: number
  isDistractor: boolean
}

export interface MatchChannelScore {
  hits: number
  misses: number
  falseAlarms: number
  correctRejections: number
  accuracy: number
}

export interface MatchMetrics {
  visual: MatchChannelScore
  semantic: MatchChannelScore
  combinedAccuracy: number
  averageLatencyMs: number
}

export interface DifficultyThresholds {
  promoteAccuracy: number
  promoteCalibration: number
  demoteAccuracy: number
  demoteCalibration: number
}

export interface DifficultyState {
  nBackLevel: number
  frameDurationMs: number
  distractorRate: number
  caseBand: CaseBand
  evidenceWindow: number
  ambiguity: number
  thresholds: DifficultyThresholds
}

export interface RoundResult {
  caseId: string
  accuracy: number
  misses: number
  falseAlarms: number
  latencyMs: number
  confidence: number
  confidenceCalibration: number
  inferredBiasTags: string[]
  recommendedNextFocus: SkillFocus
  inferenceCorrect: boolean
  explanationSummary: string
  score: number
}

export interface CaseMastery {
  plays: number
  bestScore: number
  lastPlayedAt: string
}

export interface SavedSettings {
  aiPreference: AiPreference
  reducedMotion: boolean
  audioEnabled: boolean
}

export interface PlayerProfile {
  streak: number
  weeklyMinutes: number
  unlockedBand: CaseBand
  commonReasoningErrors: string[]
  caseMastery: Record<string, CaseMastery>
  savedSettings: SavedSettings
  coachingHistorySummary: string[]
  totalRounds: number
  totalPlayMinutes: number
}

export interface CoachPayload {
  caseDefinition: CaseDefinition
  result: RoundResult
  profile: PlayerProfile
  explanation: string
  confidence: number
}

export interface CoachResponse {
  mode: 'rule' | 'chrome'
  headline: string
  bullets: string[]
  skillFocus: SkillFocus
  suggestedPrompt: string
}

export interface ExplanationResponse {
  summary: string
  strengths: string[]
  corrections: string[]
}

export interface AiCoachProvider {
  id: string
  isAvailable(): Promise<boolean>
  warmup(): Promise<void>
  coach(payload: CoachPayload): Promise<CoachResponse>
  explainInference(
    freeText: string,
    rubric: CaseDefinition,
  ): Promise<ExplanationResponse>
}

export interface CurrentRoundState {
  caseDefinition: CaseDefinition
  phase: RoundPhase
  observeCursor: number
  matchFrames: MatchFrame[]
  currentMatchIndex: number
  matchMetrics?: MatchMetrics
  inferenceSelectionId?: string
  reflectionConfidence: number
  reflectionText: string
  result?: RoundResult
  coach?: CoachResponse
  explanation?: ExplanationResponse
  startedAt: number
}

export interface SessionState {
  rounds: CurrentRoundState[]
  currentRoundIndex: number
  difficulty: DifficultyState
  sessionScore: number
  startedAt: number
  complete: boolean
}

export interface GameSummary {
  totalScore: number
  completedCases: number
  focus: SkillFocus
}

export interface GameState {
  phase: 'menu' | 'active' | 'summary'
  aiPreference: AiPreference
  aiAvailability: AiAvailability
  aiModeResolved: 'rule' | 'chrome'
  profile: PlayerProfile
  session?: SessionState
  lastSummary?: GameSummary
}
