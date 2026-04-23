import './style.css'

import { bindGameplayInput } from './game/input/actions'
import { SignalLabStore } from './game/simulation/store'
import { createSignalLabGame } from './phaser/createGame'
import { mountApp } from './ui/renderApp'

const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('Unable to mount Signal Lab.')
}

const store = new SignalLabStore()
mountApp(app, store)
bindGameplayInput(window, store)
createSignalLabGame(app.querySelector('#phaser-root') as HTMLElement, store)
void store.refreshAiStatus()
