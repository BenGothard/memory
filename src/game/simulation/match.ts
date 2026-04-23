import type {
  CaseDefinition,
  DifficultyState,
  MatchChannel,
  MatchFrame,
  MatchMetrics,
} from './types'

function hash(value: string): number {
  let result = 0
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) >>> 0
  }
  return result
}

function differentToken<T extends 'visualToken' | 'semanticToken'>(
  pool: CaseDefinition['evidenceSequence'],
  key: T,
  forbidden: string,
  seed: string,
): string {
  const candidates = pool.map((item) => item[key]).filter((token) => token !== forbidden)
  if (!candidates.length) {
    return forbidden
  }

  return candidates[hash(seed) % candidates.length]
}

export function createMatchFrames(
  caseDefinition: CaseDefinition,
  difficulty: DifficultyState,
): MatchFrame[] {
  const frameCount = Math.max(
    difficulty.evidenceWindow + difficulty.nBackLevel + 4,
    caseDefinition.evidenceSequence.length + 4,
  )
  const frames: MatchFrame[] = []
  const cards = caseDefinition.evidenceSequence

  for (let index = 0; index < frameCount; index += 1) {
    const sourceCard = cards[(index + difficulty.nBackLevel) % cards.length]
    const visualSeed = `${caseDefinition.id}:visual:${index}:${difficulty.nBackLevel}`
    const semanticSeed = `${caseDefinition.id}:semantic:${index}:${difficulty.nBackLevel}`
    const distractorSeed = `${caseDefinition.id}:distractor:${index}:${difficulty.distractorRate}`

    const visualMatch =
      index >= difficulty.nBackLevel &&
      hash(`${visualSeed}:match`) % 100 < Math.round(26 + difficulty.ambiguity * 14)
    const semanticMatch =
      index >= difficulty.nBackLevel &&
      hash(`${semanticSeed}:match`) % 100 < Math.round(24 + difficulty.ambiguity * 16)
    const isDistractor = hash(distractorSeed) % 100 < difficulty.distractorRate * 100

    const visualToken =
      visualMatch && frames[index - difficulty.nBackLevel]
        ? frames[index - difficulty.nBackLevel].visualToken
        : differentToken(cards, 'visualToken', sourceCard.visualToken, visualSeed)

    const semanticToken =
      semanticMatch && frames[index - difficulty.nBackLevel]
        ? frames[index - difficulty.nBackLevel].semanticToken
        : differentToken(cards, 'semanticToken', sourceCard.semanticToken, semanticSeed)

    frames.push({
      index,
      sourceCardId: sourceCard.id,
      visualToken: isDistractor ? differentToken(cards, 'visualToken', visualToken, `${visualSeed}:d`) : visualToken,
      semanticToken: isDistractor
        ? differentToken(cards, 'semanticToken', semanticToken, `${semanticSeed}:d`)
        : semanticToken,
      expected: {
        visual: visualMatch && !isDistractor,
        semantic: semanticMatch && !isDistractor,
      },
      responded: { visual: false, semantic: false },
      latencyMs: {},
      isDistractor,
    })
  }

  return frames
}

export function registerMatchAttempt(
  frames: MatchFrame[],
  currentIndex: number,
  channel: MatchChannel,
  responseAtMs: number,
): { accepted: boolean; correct: boolean } {
  const frame = frames[currentIndex]
  if (!frame || frame.responded[channel]) {
    return { accepted: false, correct: false }
  }

  frame.responded[channel] = true

  if (frame.expected[channel] && typeof frame.presentedAtMs === 'number') {
    frame.latencyMs[channel] = Math.max(responseAtMs - frame.presentedAtMs, 0)
  }

  return { accepted: true, correct: frame.expected[channel] }
}

function channelMetrics(
  frames: MatchFrame[],
  channel: MatchChannel,
): MatchMetrics['visual'] {
  let hits = 0
  let misses = 0
  let falseAlarms = 0
  let correctRejections = 0

  for (const frame of frames) {
    if (frame.expected[channel]) {
      if (frame.responded[channel]) {
        hits += 1
      } else {
        misses += 1
      }
    } else if (frame.responded[channel]) {
      falseAlarms += 1
    } else {
      correctRejections += 1
    }
  }

  const total = hits + misses + falseAlarms + correctRejections

  return {
    hits,
    misses,
    falseAlarms,
    correctRejections,
    accuracy: total === 0 ? 0 : (hits + correctRejections) / total,
  }
}

export function summarizeMatchFrames(frames: MatchFrame[]): MatchMetrics {
  const visual = channelMetrics(frames, 'visual')
  const semantic = channelMetrics(frames, 'semantic')
  const latencySamples = frames.flatMap((frame) =>
    Object.values(frame.latencyMs).filter((value): value is number => typeof value === 'number'),
  )

  return {
    visual,
    semantic,
    combinedAccuracy: (visual.accuracy + semantic.accuracy) / 2,
    averageLatencyMs:
      latencySamples.length > 0
        ? latencySamples.reduce((sum, value) => sum + value, 0) / latencySamples.length
        : 0,
  }
}
