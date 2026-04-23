import Phaser from 'phaser'

import { SignalLabStore } from '../../game/simulation/store'
import type { GameState, RoundPhase } from '../../game/simulation/types'

export class SceneBridge {
  private unsubscribe?: () => void
  private observeTimer?: Phaser.Time.TimerEvent
  private matchTimer?: Phaser.Time.TimerEvent
  private activePhase?: RoundPhase | 'menu' | 'summary'
  private readonly scene: Phaser.Scene
  private readonly store: SignalLabStore

  constructor(scene: Phaser.Scene, store: SignalLabStore) {
    this.scene = scene
    this.store = store
  }

  connect(render: (state: GameState) => void): void {
    this.unsubscribe = this.store.subscribe((state) => {
      render(state)
      this.sync(state)
    })
  }

  disconnect(): void {
    this.stopObserveLoop()
    this.stopMatchLoop()
    this.unsubscribe?.()
  }

  private sync(state: GameState): void {
    const round = state.session?.rounds[state.session.currentRoundIndex]
    const nextPhase = state.phase === 'summary' ? 'summary' : round?.phase ?? 'menu'

    if (nextPhase === this.activePhase) {
      return
    }

    this.activePhase = nextPhase
    this.stopObserveLoop()
    this.stopMatchLoop()

    if (round?.phase === 'observe') {
      this.observeTimer = this.scene.time.addEvent({
        delay: 1400,
        loop: true,
        callback: () => this.store.advanceObserve(),
      })
    }

    if (round?.phase === 'match') {
      const delay = state.session?.difficulty.frameDurationMs ?? 1500
      this.scene.time.delayedCall(80, () => {
        this.store.advanceMatchFrame(this.scene.time.now)
      })
      this.matchTimer = this.scene.time.addEvent({
        delay,
        loop: true,
        callback: () => {
          const active = this.store.advanceMatchFrame(this.scene.time.now)
          if (!active) {
            this.stopMatchLoop()
          }
        },
      })
    }
  }

  private stopObserveLoop(): void {
    this.observeTimer?.remove(false)
    this.observeTimer = undefined
  }

  private stopMatchLoop(): void {
    this.matchTimer?.remove(false)
    this.matchTimer = undefined
  }
}
