import Phaser from 'phaser'

import { SignalLabStore } from '../game/simulation/store'
import { BootScene } from './scenes/BootScene'
import { GameplayScene } from './scenes/GameplayScene'

export function createSignalLabGame(
  parent: string | HTMLElement,
  store: SignalLabStore,
): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#07141f',
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: window.innerWidth,
      height: window.innerHeight,
    },
    scene: [new BootScene(), new GameplayScene(store)],
  })
}
