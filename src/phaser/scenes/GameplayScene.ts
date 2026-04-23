import Phaser from 'phaser'

import { tokenStyle, qualityColor } from '../../game/assets/manifest'
import { SignalLabStore } from '../../game/simulation/store'
import type { CurrentRoundState, GameState } from '../../game/simulation/types'
import { SceneBridge } from '../adapters/sceneBridge'

function currentRound(state: GameState): CurrentRoundState | undefined {
  return state.session?.rounds[state.session.currentRoundIndex]
}

export class GameplayScene extends Phaser.Scene {
  private readonly bridge: SceneBridge
  private readonly store: SignalLabStore
  private graphics!: Phaser.GameObjects.Graphics
  private titleText!: Phaser.GameObjects.Text
  private phaseText!: Phaser.GameObjects.Text
  private bodyText!: Phaser.GameObjects.Text
  private leftText!: Phaser.GameObjects.Text
  private rightText!: Phaser.GameObjects.Text
  private hintText!: Phaser.GameObjects.Text
  private latestState?: GameState

  constructor(store: SignalLabStore) {
    super('gameplay')
    this.store = store
    this.bridge = new SceneBridge(this, store)
  }

  create(): void {
    this.graphics = this.add.graphics()
    this.titleText = this.add.text(0, 0, '', {})
    this.phaseText = this.add.text(0, 0, '', {})
    this.bodyText = this.add.text(0, 0, '', {})
    this.leftText = this.add.text(0, 0, '', {})
    this.rightText = this.add.text(0, 0, '', {})
    this.hintText = this.add.text(0, 0, '', {})

    this.graphics.setDepth(1)
    this.titleText.setDepth(2)
    this.phaseText.setDepth(2)
    this.bodyText.setDepth(2)
    this.leftText.setDepth(2)
    this.rightText.setDepth(2)
    this.hintText.setDepth(2)

    this.titleText.setFontFamily('Avenir Next')
    this.titleText.setFontStyle('700')
    this.titleText.setFontSize(28)
    this.phaseText.setFontFamily('Avenir Next')
    this.phaseText.setFontStyle('600')
    this.phaseText.setFontSize(16)
    this.bodyText.setFontFamily('Iowan Old Style')
    this.bodyText.setFontSize(20)
    this.leftText.setFontFamily('Avenir Next')
    this.leftText.setFontSize(22)
    this.rightText.setFontFamily('Avenir Next')
    this.rightText.setFontSize(22)
    this.hintText.setFontFamily('Avenir Next')
    this.hintText.setFontSize(14)

    this.scale.on('resize', () => {
      if (this.latestState) {
        this.renderState(this.latestState)
      }
    })

    this.bridge.connect((state) => this.renderState(state))
  }

  shutdown(): void {
    this.bridge.disconnect()
  }

  private renderState(state: GameState): void {
    this.latestState = state
    const round = currentRound(state)
    const width = this.scale.width
    const height = this.scale.height
    const panelWidth = Math.min(width * 0.72, 840)
    const panelHeight = Math.min(height * 0.62, 520)
    const panelX = (width - panelWidth) / 2
    const panelY = Math.max(100, (height - panelHeight) / 2)

    this.graphics.clear()
    this.graphics.fillStyle(0x07141f, 1)
    this.graphics.fillRect(0, 0, width, height)
    this.graphics.fillStyle(0x0d2231, 1)
    this.graphics.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 32)
    this.graphics.lineStyle(1, 0x274255, 0.8)
    this.graphics.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 32)

    for (let index = 0; index < 20; index += 1) {
      const alpha = index % 2 === 0 ? 0.1 : 0.04
      this.graphics.lineStyle(1, 0x173041, alpha)
      this.graphics.lineBetween(0, index * 48, width, index * 48)
    }

    this.titleText.setPosition(panelX + 32, panelY + 28)
    this.phaseText.setPosition(panelX + 32, panelY + 70)
    this.bodyText.setPosition(panelX + 32, panelY + 112)
    this.leftText.setPosition(panelX + 78, panelY + 188)
    this.rightText.setPosition(panelX + panelWidth / 2 + 30, panelY + 188)
    this.hintText.setPosition(panelX + 32, panelY + panelHeight - 56)

    if (!round) {
      this.renderIdle(panelX, panelY, panelWidth)
      return
    }

    this.titleText.setText(round.caseDefinition.title)
    this.phaseText.setText(`Phase: ${round.phase.toUpperCase()}`)
    this.titleText.setColor('#f4f0e8')
    this.phaseText.setColor('#94d2bd')

    switch (round.phase) {
      case 'briefing':
        this.renderBriefing(round, panelWidth)
        break
      case 'observe':
        this.renderObserve(round, panelX, panelY, panelWidth)
        break
      case 'match':
        this.renderMatch(round, panelX, panelY, panelWidth)
        break
      case 'infer':
      case 'reflect':
      case 'report':
        this.renderInferenceBackdrop(round, panelX, panelY, panelWidth)
        break
    }
  }

  private renderIdle(panelX: number, panelY: number, panelWidth: number): void {
    this.titleText.setText('Signal Lab')
    this.phaseText.setText('Memory drills for critical-thinking transfer')
    this.bodyText.setText(
      'Observe controlled evidence. Hold the signal. Test a claim. Reflect on how your confidence matched the data.',
    )
    this.bodyText.setWordWrapWidth(panelWidth - 64)
    this.bodyText.setColor('#d6d3cb')
    this.leftText.setText('Dual-channel\nn-back')
    this.rightText.setText('Inference\nunder uncertainty')
    this.leftText.setColor('#66d9ef')
    this.rightText.setColor('#ffd166')
    this.hintText.setText('The live simulation appears here once you start a three-case session.')
    this.hintText.setColor('#8aa4b8')

    this.graphics.fillStyle(0x12283a, 1)
    this.graphics.fillRoundedRect(panelX + 54, panelY + 176, 220, 180, 24)
    this.graphics.fillRoundedRect(panelX + panelWidth - 274, panelY + 176, 220, 180, 24)
  }

  private renderBriefing(
    round: CurrentRoundState,
    panelWidth: number,
  ): void {
    this.bodyText.setText(round.caseDefinition.premise)
    this.bodyText.setWordWrapWidth(panelWidth - 64)
    this.bodyText.setColor('#d6d3cb')
    this.leftText.setText(`Focus\n${round.caseDefinition.focus.replace('-', ' ')}`)
    this.rightText.setText(`Bias risks\n${round.caseDefinition.biasTags.join('\n')}`)
    this.leftText.setColor('#95f9b3')
    this.rightText.setColor('#f7a072')
    this.hintText.setText('Start the round to stream each evidence card across the lab table.')
    this.hintText.setColor('#8aa4b8')
  }

  private renderObserve(
    round: CurrentRoundState,
    panelX: number,
    panelY: number,
    panelWidth: number,
  ): void {
    const card = round.caseDefinition.evidenceSequence[round.observeCursor]
    const token = tokenStyle(card.visualToken)
    const centerX = panelX + panelWidth / 2
    const cardY = panelY + 204
    const cardWidth = Math.min(panelWidth - 120, 480)
    const cardHeight = 220

    this.graphics.fillStyle(token.secondary, 1)
    this.graphics.fillRoundedRect(centerX - cardWidth / 2, cardY, cardWidth, cardHeight, 28)
    this.graphics.lineStyle(2, token.primary, 0.8)
    this.graphics.strokeRoundedRect(centerX - cardWidth / 2, cardY, cardWidth, cardHeight, 28)
    this.graphics.fillStyle(qualityColor(card.source.quality), 1)
    this.graphics.fillRoundedRect(centerX - cardWidth / 2 + 18, cardY + 18, 10, cardHeight - 36, 8)

    this.bodyText.setText(`${card.label}\n${card.summary}`)
    this.bodyText.setWordWrapWidth(panelWidth - 160)
    this.bodyText.setColor('#e8e3d8')
    this.leftText.setText(`Variable\n${card.variable}\n\nSignal\n${card.numericSignal}`)
    this.rightText.setText(`Source\n${card.source.label}\n\nQuality\n${card.source.quality}`)
    this.leftText.setColor('#66d9ef')
    this.rightText.setColor('#ffd166')
    this.hintText.setText(`Hold the visual token "${token.label}" and semantic cue "${card.semanticToken}" in working memory.`)
    this.hintText.setColor('#8aa4b8')
  }

  private renderMatch(
    round: CurrentRoundState,
    panelX: number,
    panelY: number,
    panelWidth: number,
  ): void {
    const frame = round.matchFrames[Math.max(round.currentMatchIndex, 0)]
    const visual = tokenStyle(frame.visualToken)
    const semantic = tokenStyle(frame.semanticToken)
    const laneY = panelY + 180
    const laneWidth = 260
    const laneHeight = 230
    const leftX = panelX + 54
    const rightX = panelX + panelWidth - laneWidth - 54

    this.graphics.fillStyle(visual.secondary, 1)
    this.graphics.fillRoundedRect(leftX, laneY, laneWidth, laneHeight, 24)
    this.graphics.lineStyle(2, visual.primary, 0.8)
    this.graphics.strokeRoundedRect(leftX, laneY, laneWidth, laneHeight, 24)
    this.graphics.fillStyle(semantic.secondary, 1)
    this.graphics.fillRoundedRect(rightX, laneY, laneWidth, laneHeight, 24)
    this.graphics.lineStyle(2, semantic.primary, 0.8)
    this.graphics.strokeRoundedRect(rightX, laneY, laneWidth, laneHeight, 24)

    this.bodyText.setText(
      `Match anything that repeats ${this.store.getState().session?.difficulty.nBackLevel ?? 1} step${(this.store.getState().session?.difficulty.nBackLevel ?? 1) > 1 ? 's' : ''} back.`,
    )
    this.bodyText.setWordWrapWidth(panelWidth - 64)
    this.bodyText.setColor('#e8e3d8')
    this.leftText.setText(`Visual lane\n\n${visual.label}`)
    this.rightText.setText(`Semantic lane\n\n${frame.semanticToken}`)
    this.leftText.setColor('#66d9ef')
    this.rightText.setColor('#ffd166')
    this.hintText.setText('Press A for a visual match or L for a semantic match. Distractors are mixed in.')
    this.hintText.setColor('#8aa4b8')
  }

  private renderInferenceBackdrop(
    round: CurrentRoundState,
    panelX: number,
    panelY: number,
    panelWidth: number,
  ): void {
    const card = round.caseDefinition.evidenceSequence[0]
    const token = tokenStyle(card.visualToken)

    this.graphics.fillStyle(token.secondary, 1)
    this.graphics.fillRoundedRect(panelX + 64, panelY + 206, panelWidth - 128, 190, 28)
    this.graphics.lineStyle(2, token.primary, 0.7)
    this.graphics.strokeRoundedRect(panelX + 64, panelY + 206, panelWidth - 128, 190, 28)

    this.bodyText.setText(round.caseDefinition.inference.prompt)
    this.bodyText.setWordWrapWidth(panelWidth - 64)
    this.bodyText.setColor('#e8e3d8')
    this.leftText.setText(`Strongest evidence\n${round.caseDefinition.inference.strongestEvidence}`)
    this.leftText.setWordWrapWidth(panelWidth / 2 - 80)
    this.leftText.setColor('#95f9b3')
    this.rightText.setText(`Counterweight\n${round.caseDefinition.inference.counterWeight}`)
    this.rightText.setWordWrapWidth(panelWidth / 2 - 80)
    this.rightText.setColor('#f7a072')
    this.hintText.setText('Use the DOM panel to choose, reflect, and review your local coaching summary.')
    this.hintText.setColor('#8aa4b8')
  }
}
