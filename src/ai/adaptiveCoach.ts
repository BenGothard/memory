import type {
  AiAvailability,
  AiCoachProvider,
  AiPreference,
  CaseDefinition,
  CoachPayload,
  CoachResponse,
  ExplanationResponse,
  SkillFocus,
} from '../game/simulation/types'

type LanguageModelSession = {
  prompt(input: string): Promise<string>
  destroy?: () => void
}

type LanguageModelFactory = {
  availability?: () => Promise<string> | string
  create?: () => Promise<LanguageModelSession>
}

declare global {
  interface Window {
    ai?: {
      languageModel?: LanguageModelFactory
    }
    LanguageModel?: LanguageModelFactory
  }
}

function focusLabel(focus: SkillFocus): string {
  return focus.replace('-', ' ')
}

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((part) => part.length > 4)
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    const match = value.match(/\{[\s\S]*\}/)
    if (!match) {
      return null
    }

    try {
      return JSON.parse(match[0]) as T
    } catch {
      return null
    }
  }
}

export class RuleCoachProvider implements AiCoachProvider {
  id = 'rule'

  async isAvailable(): Promise<boolean> {
    return true
  }

  async warmup(): Promise<void> {}

  async coach(payload: CoachPayload): Promise<CoachResponse> {
    const { result, caseDefinition } = payload
    const bullets: string[] = []

    if (result.accuracy < 0.7) {
      bullets.push(
        `Your match accuracy dipped, so rehearse two evidence anchors before reacting to the next n-back stream.`,
      )
    }

    if (!result.inferenceCorrect) {
      bullets.push(
        `The strongest support came from ${caseDefinition.inference.strongestEvidence.toLowerCase()}`,
      )
    }

    if (result.confidenceCalibration < 0.55) {
      bullets.push(
        result.inferenceCorrect
          ? 'Your answer was stronger than your confidence suggested, so practice trusting well-controlled evidence.'
          : 'Your confidence outran the evidence, so pause to test one counter-hypothesis before committing.',
      )
    }

    if (bullets.length < 3) {
      bullets.push(
        `Stay alert for ${caseDefinition.biasTags[0]} in this kind of science-and-logic scenario.`,
      )
    }

    if (bullets.length < 3) {
      bullets.push(
        `Next round, focus on ${focusLabel(result.recommendedNextFocus)} when the stream speeds up.`,
      )
    }

    return {
      mode: 'rule',
      headline: result.inferenceCorrect
        ? 'Evidence chain held together.'
        : 'The case slipped at the evidence-to-claim step.',
      bullets: bullets.slice(0, 3),
      skillFocus: result.recommendedNextFocus,
      suggestedPrompt: caseDefinition.reflectionPrompts[0]?.prompt ?? 'Explain which evidence you trusted most.',
    }
  }

  async explainInference(
    freeText: string,
    rubric: CaseDefinition,
  ): Promise<ExplanationResponse> {
    const keywords = extractKeywords(
      `${rubric.inference.strongestEvidence} ${rubric.rubricTags.join(' ')}`,
    )
    const lowered = freeText.toLowerCase()
    const matched = keywords.filter((keyword) => lowered.includes(keyword)).slice(0, 2)

    return {
      summary: matched.length
        ? 'Your explanation connected to the strongest evidence, but it can name the control logic more explicitly.'
        : 'Your explanation needs a tighter link between the observed signal, the controlled variable, and the final claim.',
      strengths:
        matched.length > 0
          ? matched.map((keyword) => `You referenced the key idea "${keyword}".`)
          : ['You engaged the prompt instead of skipping the reasoning step.'],
      corrections: [
        `Name why ${rubric.inference.counterWeight.toLowerCase()}`,
        `Use at least one rubric tag such as ${rubric.rubricTags.slice(0, 2).join(' or ')} in your own words.`,
      ],
    }
  }
}

export class ChromePromptProvider implements AiCoachProvider {
  id = 'chrome'
  private session?: LanguageModelSession

  private factory(): LanguageModelFactory | undefined {
    if (typeof window === 'undefined') {
      return undefined
    }

    return window.LanguageModel ?? window.ai?.languageModel
  }

  async isAvailable(): Promise<boolean> {
    const factory = this.factory()
    if (!factory?.create) {
      return false
    }

    if (!factory.availability) {
      return true
    }

    const status = await factory.availability()
    return !['no', 'unavailable'].includes(String(status))
  }

  async warmup(): Promise<void> {
    if (this.session) {
      return
    }

    const factory = this.factory()
    if (!factory?.create) {
      throw new Error('Chrome Prompt API unavailable.')
    }

    this.session = await factory.create()
  }

  private async prompt<T>(promptText: string): Promise<T> {
    await this.warmup()
    const response = await this.session!.prompt(promptText)
    const parsed = safeJsonParse<T>(response)

    if (!parsed) {
      throw new Error('Prompt API returned non-JSON output.')
    }

    return parsed
  }

  async coach(payload: CoachPayload): Promise<CoachResponse> {
    return this.prompt<CoachResponse>(`
Return strict JSON with keys mode, headline, bullets, skillFocus, suggestedPrompt.
mode must be "chrome".
skillFocus must be one of "working-memory", "inhibition", "flexibility", "evidence-evaluation", "metacognition".
bullets must be an array of exactly 3 short strings.
This is a browser game coaching summary for adults 16+.
Case title: ${payload.caseDefinition.title}
Focus: ${payload.caseDefinition.focus}
Result score: ${payload.result.score}
Accuracy: ${payload.result.accuracy}
Confidence calibration: ${payload.result.confidenceCalibration}
Inference correct: ${payload.result.inferenceCorrect}
Bias tags: ${payload.caseDefinition.biasTags.join(', ')}
Reflection text: ${payload.explanation || '(blank)'}
Suggested skill focus: ${payload.result.recommendedNextFocus}
    `)
  }

  async explainInference(
    freeText: string,
    rubric: CaseDefinition,
  ): Promise<ExplanationResponse> {
    return this.prompt<ExplanationResponse>(`
Return strict JSON with keys summary, strengths, corrections.
strengths and corrections must each be arrays of 2 short strings.
Analyze this explanation for a critical-thinking training game.
Case title: ${rubric.title}
Strongest evidence: ${rubric.inference.strongestEvidence}
Counterweight: ${rubric.inference.counterWeight}
Rubric tags: ${rubric.rubricTags.join(', ')}
Learner explanation: ${freeText || '(blank)'}
    `)
  }
}

export class AdaptiveCoachManager implements AiCoachProvider {
  id = 'adaptive'
  private preference: AiPreference
  private readonly ruleProvider = new RuleCoachProvider()
  private readonly chromeProvider = new ChromePromptProvider()

  constructor(initialPreference: AiPreference = 'auto') {
    this.preference = initialPreference
  }

  setPreference(preference: AiPreference): void {
    this.preference = preference
  }

  getPreference(): AiPreference {
    return this.preference
  }

  async getStatus(): Promise<{ availability: AiAvailability; resolvedMode: 'rule' | 'chrome' }> {
    if (this.preference === 'rule') {
      return { availability: 'ready', resolvedMode: 'rule' }
    }

    const chromeAvailable = await this.chromeProvider.isAvailable()
    if (chromeAvailable) {
      return {
        availability: 'ready',
        resolvedMode: this.preference === 'chrome' || this.preference === 'auto' ? 'chrome' : 'rule',
      }
    }

    if (this.preference === 'auto') {
      return {
        availability: 'ready',
        resolvedMode: 'rule',
      }
    }

    return {
      availability: this.preference === 'chrome' ? 'fallback' : 'unavailable',
      resolvedMode: 'rule',
    }
  }

  async isAvailable(): Promise<boolean> {
    return true
  }

  async warmup(): Promise<void> {
    const provider = await this.resolveProvider()
    await provider.warmup()
  }

  async coach(payload: CoachPayload): Promise<CoachResponse> {
    const provider = await this.resolveProvider()
    try {
      return await provider.coach(payload)
    } catch {
      return this.ruleProvider.coach(payload)
    }
  }

  async explainInference(
    freeText: string,
    rubric: CaseDefinition,
  ): Promise<ExplanationResponse> {
    const provider = await this.resolveProvider()
    try {
      return await provider.explainInference(freeText, rubric)
    } catch {
      return this.ruleProvider.explainInference(freeText, rubric)
    }
  }

  private async resolveProvider(): Promise<AiCoachProvider> {
    const status = await this.getStatus()
    return status.resolvedMode === 'chrome' ? this.chromeProvider : this.ruleProvider
  }
}
