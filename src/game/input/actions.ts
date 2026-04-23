import type { GameState, MatchChannel } from '../simulation/types'
import { SignalLabStore } from '../simulation/store'

export const MATCH_CONTROLS: Array<{ label: string; channel: MatchChannel; key: string }> = [
  { label: 'Visual match', channel: 'visual', key: 'A' },
  { label: 'Semantic match', channel: 'semantic', key: 'L' },
]

function currentRound(state: GameState) {
  return state.session?.rounds[state.session.currentRoundIndex]
}

export function bindGameplayInput(
  target: Window,
  store: SignalLabStore,
): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) {
      return
    }

    const state = store.getState()
    const round = currentRound(state)
    if (!round) {
      return
    }

    if (round.phase === 'match') {
      if (event.code === 'KeyA' || event.code === 'ArrowLeft') {
        store.registerMatchAttempt('visual', performance.now())
      }

      if (event.code === 'KeyL' || event.code === 'ArrowRight') {
        store.registerMatchAttempt('semantic', performance.now())
      }
    }

    if (round.phase === 'briefing' && (event.code === 'Enter' || event.code === 'Space')) {
      event.preventDefault()
      store.beginObserve()
    }
  }

  target.addEventListener('keydown', onKeyDown)
  return () => target.removeEventListener('keydown', onKeyDown)
}
