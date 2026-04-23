import { describe, expect, it } from 'vitest'

import { AdaptiveCoachManager } from '../../ai/adaptiveCoach'
import { createMemoryStorage } from './storage'
import { SignalLabStore } from './store'

describe('signal lab store', () => {
  it('runs a full round and persists profile progress', async () => {
    const storage = createMemoryStorage()
    const store = new SignalLabStore({
      storage,
      aiCoach: new AdaptiveCoachManager('rule'),
    })

    store.startSession()
    store.beginObserve()

    while (store.getState().session?.rounds[0].phase === 'observe') {
      store.advanceObserve()
    }

    let now = 1000
    while (store.getState().session?.rounds[0].phase === 'match') {
      const advanced = store.advanceMatchFrame(now)
      const round = store.getState().session!.rounds[0]

      if (!advanced) {
        break
      }

      const frame = round.matchFrames[round.currentMatchIndex]
      if (frame.expected.visual) {
        store.registerMatchAttempt('visual', now + 120)
      }

      if (frame.expected.semantic) {
        store.registerMatchAttempt('semantic', now + 170)
      }

      now += 1000
    }

    const round = store.getState().session!.rounds[0]
    store.submitInference(round.caseDefinition.inference.correctOptionId)
    store.setReflectionConfidence(78)
    store.setReflectionText('The strongest evidence kept temperature controlled while the weaker claim was anecdotal.')
    await store.submitReflection()

    const updatedRound = store.getState().session!.rounds[0]
    expect(updatedRound.phase).toBe('report')
    expect(updatedRound.result?.score).toBeGreaterThan(0)
    expect(store.getState().profile.totalRounds).toBe(1)

    const reloaded = new SignalLabStore({
      storage,
      aiCoach: new AdaptiveCoachManager('rule'),
    })

    expect(reloaded.getState().profile.totalRounds).toBe(1)
    expect(reloaded.getState().profile.caseMastery[round.caseDefinition.id]).toBeDefined()
  })
})
