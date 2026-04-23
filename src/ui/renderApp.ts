import { MATCH_CONTROLS } from '../game/input/actions'
import { SignalLabStore } from '../game/simulation/store'
import type { CurrentRoundState, GameState, MatchChannel } from '../game/simulation/types'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function currentRound(state: GameState): CurrentRoundState | undefined {
  return state.session?.rounds[state.session.currentRoundIndex]
}

function aiStatusLabel(state: GameState): string {
  if (state.aiModeResolved === 'chrome') {
    return state.aiAvailability === 'ready' ? 'Browser AI active' : 'Browser AI requested'
  }

  return state.aiAvailability === 'fallback' ? 'Rule coach fallback' : 'Rule coach active'
}

function renderMenu(state: GameState): string {
  return `
    <section class="panel-card panel-card--hero">
      <p class="eyebrow">Local-first browser game</p>
      <h1>Signal Lab</h1>
      <p class="hero-copy">
        Practice working memory, inhibition, evidence evaluation, and metacognitive reflection
        through short science-and-logic cases grounded in the critical-thinking paper.
      </p>
      <div class="hero-stats">
        <div><span>Total rounds</span><strong>${state.profile.totalRounds}</strong></div>
        <div><span>Weekly minutes</span><strong>${state.profile.weeklyMinutes}</strong></div>
        <div><span>Unlocked band</span><strong>${state.profile.unlockedBand}</strong></div>
      </div>
      <button class="primary-button" data-action="start-session">Start Three-Case Session</button>
    </section>
  `
}

function renderBriefing(round: CurrentRoundState): string {
  return `
    <section class="panel-card">
      <p class="eyebrow">Case briefing</p>
      <h2>${round.caseDefinition.title}</h2>
      <p>${round.caseDefinition.premise}</p>
      <div class="tag-row">
        <span>${round.caseDefinition.band}</span>
        <span>${round.caseDefinition.focus}</span>
        <span>${round.caseDefinition.rubricTags.join(' / ')}</span>
      </div>
      <button class="primary-button" data-action="begin-observe">Begin Observe Phase</button>
    </section>
  `
}

function renderObserve(round: CurrentRoundState): string {
  const card = round.caseDefinition.evidenceSequence[round.observeCursor]
  return `
    <section class="panel-card">
      <p class="eyebrow">Observe</p>
      <h2>${card.label}</h2>
      <p>${card.summary}</p>
      <div class="metric-grid">
        <div><span>Variable</span><strong>${card.variable}</strong></div>
        <div><span>Signal</span><strong>${card.numericSignal}</strong></div>
        <div><span>Source</span><strong>${card.source.label}</strong></div>
        <div><span>Quality</span><strong>${card.source.quality}</strong></div>
      </div>
    </section>
  `
}

function controlButton(channel: MatchChannel, label: string, key: string): string {
  return `
    <button class="response-button" data-action="match-${channel}">
      <span>${label}</span>
      <strong>${key}</strong>
    </button>
  `
}

function renderMatch(round: CurrentRoundState, state: GameState): string {
  const matchMetrics = round.matchMetrics
  return `
    <section class="panel-card">
      <p class="eyebrow">Match</p>
      <h2>Hold both streams at once</h2>
      <p>
        Detect repeats ${state.session?.difficulty.nBackLevel ?? 1} step${(state.session?.difficulty.nBackLevel ?? 1) > 1 ? 's' : ''} back while ignoring distractors.
      </p>
      <div class="response-grid">
        ${MATCH_CONTROLS.map((control) =>
          controlButton(control.channel, control.label, control.key),
        ).join('')}
      </div>
      <div class="metric-grid metric-grid--compact">
        <div><span>Frame</span><strong>${Math.max(round.currentMatchIndex + 1, 0)} / ${round.matchFrames.length}</strong></div>
        <div><span>Target n</span><strong>${state.session?.difficulty.nBackLevel ?? 1}</strong></div>
        <div><span>Visual hits</span><strong>${matchMetrics?.visual.hits ?? 0}</strong></div>
        <div><span>Semantic hits</span><strong>${matchMetrics?.semantic.hits ?? 0}</strong></div>
      </div>
    </section>
  `
}

function renderInfer(round: CurrentRoundState): string {
  return `
    <section class="panel-card">
      <p class="eyebrow">Infer</p>
      <h2>${round.caseDefinition.inference.prompt}</h2>
      <div class="option-list">
        ${round.caseDefinition.inference.options
          .map(
            (option) => `
              <button class="option-button" data-action="submit-inference" data-option-id="${option.id}">
                <strong>${option.text}</strong>
                <span>${option.rationale}</span>
              </button>
            `,
          )
          .join('')}
      </div>
    </section>
  `
}

function renderReflect(round: CurrentRoundState): string {
  return `
    <section class="panel-card">
      <p class="eyebrow">Reflect</p>
      <h2>Calibrate your confidence</h2>
      <label class="slider-field">
        <span>Confidence: ${round.reflectionConfidence}</span>
        <input type="range" min="0" max="100" value="${round.reflectionConfidence}" data-action="confidence" />
      </label>
      <label class="text-field">
        <span>${round.caseDefinition.reflectionPrompts[0]?.prompt ?? 'Explain your reasoning.'}</span>
        <textarea rows="5" data-action="reflection-text">${escapeHtml(round.reflectionText)}</textarea>
      </label>
      <button class="primary-button" data-action="submit-reflection">Generate Local Coaching</button>
    </section>
  `
}

function renderReport(round: CurrentRoundState, state: GameState): string {
  const result = round.result
  const coach = round.coach
  const explanation = round.explanation
  const isLastRound =
    state.session && state.session.currentRoundIndex === state.session.rounds.length - 1

  return `
    <section class="panel-card">
      <p class="eyebrow">Report</p>
      <h2>${coach?.headline ?? 'Processing your report'}</h2>
      <div class="metric-grid">
        <div><span>Score</span><strong>${result?.score ?? 0}</strong></div>
        <div><span>Accuracy</span><strong>${Math.round((result?.accuracy ?? 0) * 100)}%</strong></div>
        <div><span>Calibration</span><strong>${Math.round((result?.confidenceCalibration ?? 0) * 100)}%</strong></div>
        <div><span>Focus next</span><strong>${result?.recommendedNextFocus ?? 'evidence-evaluation'}</strong></div>
      </div>
      <ul class="report-list">
        ${(coach?.bullets ?? []).map((item) => `<li>${item}</li>`).join('')}
      </ul>
      ${
        explanation
          ? `
          <div class="report-grid">
            <div>
              <h3>Explanation check</h3>
              <p>${explanation.summary}</p>
            </div>
            <div>
              <h3>Strengths</h3>
              <ul>${explanation.strengths.map((item) => `<li>${item}</li>`).join('')}</ul>
            </div>
            <div>
              <h3>Corrections</h3>
              <ul>${explanation.corrections.map((item) => `<li>${item}</li>`).join('')}</ul>
            </div>
          </div>
        `
          : ''
      }
      <button class="primary-button" data-action="advance-round">
        ${isLastRound ? 'Finish Session' : 'Next Case'}
      </button>
    </section>
  `
}

function renderSummary(state: GameState): string {
  return `
    <section class="panel-card panel-card--hero">
      <p class="eyebrow">Session complete</p>
      <h1>Signal report ready</h1>
      <div class="hero-stats">
        <div><span>Total score</span><strong>${state.lastSummary?.totalScore ?? 0}</strong></div>
        <div><span>Cases solved</span><strong>${state.lastSummary?.completedCases ?? 0}</strong></div>
        <div><span>Next focus</span><strong>${state.lastSummary?.focus ?? 'evidence-evaluation'}</strong></div>
      </div>
      <p class="hero-copy">
        Your progress is saved locally. The next session will rotate to new cases while adapting n-back pace and distractor density.
      </p>
      <button class="primary-button" data-action="reset-menu">Back to Menu</button>
    </section>
  `
}

function renderDrawer(state: GameState): string {
  const round = currentRound(state)

  if (!round) {
    return `
      <section class="drawer-card">
        <h3>Profile snapshot</h3>
        <ul class="mini-list">
          <li>Streak: ${state.profile.streak}</li>
          <li>Common errors: ${state.profile.commonReasoningErrors.join(', ') || 'None yet'}</li>
          <li>Coach history: ${state.profile.coachingHistorySummary.join(' | ') || 'No sessions yet'}</li>
        </ul>
      </section>
    `
  }

  return `
    <section class="drawer-card">
      <h3>Evidence ledger</h3>
      <ol class="ledger-list">
        ${round.caseDefinition.evidenceSequence
          .map(
            (item, index) => `
              <li class="${index === round.observeCursor && round.phase === 'observe' ? 'is-active' : ''}">
                <strong>${item.label}</strong>
                <span>${item.semanticToken}</span>
                <em>${item.source.quality}</em>
              </li>
            `,
          )
          .join('')}
      </ol>
    </section>
  `
}

function renderHud(state: GameState): string {
  const round = currentRound(state)
  const score = state.session?.sessionScore ?? 0
  const nBack = state.session?.difficulty.nBackLevel ?? 1
  const focus = round?.result?.recommendedNextFocus ?? round?.caseDefinition.focus ?? 'evidence-evaluation'

  return `
    <div class="hud-cluster">
      <div class="hud-chip"><span>Score</span><strong>${score}</strong></div>
      <div class="hud-chip"><span>Streak</span><strong>${state.profile.streak}</strong></div>
      <div class="hud-chip"><span>n-back</span><strong>${nBack}</strong></div>
      <div class="hud-chip"><span>Focus</span><strong>${focus}</strong></div>
    </div>
    <button class="hud-toggle" data-action="toggle-ai">
      <span>AI mode: ${state.aiPreference}</span>
      <strong>${aiStatusLabel(state)}</strong>
    </button>
  `
}

function renderPanel(state: GameState): string {
  const round = currentRound(state)

  if (state.phase === 'summary') {
    return renderSummary(state)
  }

  if (!round) {
    return renderMenu(state)
  }

  switch (round.phase) {
    case 'briefing':
      return renderBriefing(round)
    case 'observe':
      return renderObserve(round)
    case 'match':
      return renderMatch(round, state)
    case 'infer':
      return renderInfer(round)
    case 'reflect':
      return renderReflect(round)
    case 'report':
      return renderReport(round, state)
  }
}

export function mountApp(root: HTMLElement, store: SignalLabStore): void {
  root.innerHTML = `
    <div class="signal-lab-shell">
      <div id="phaser-root" class="playfield"></div>
      <header id="hud-root" class="hud-layer"></header>
      <aside id="panel-root" class="panel-layer"></aside>
      <aside id="drawer-root" class="drawer-layer"></aside>
    </div>
  `

  const hudRoot = root.querySelector<HTMLElement>('#hud-root')!
  const panelRoot = root.querySelector<HTMLElement>('#panel-root')!
  const drawerRoot = root.querySelector<HTMLElement>('#drawer-root')!

  store.subscribe((state) => {
    hudRoot.innerHTML = renderHud(state)
    panelRoot.innerHTML = renderPanel(state)
    drawerRoot.innerHTML = renderDrawer(state)
  })

  root.addEventListener('click', async (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-action]')
    if (!target) {
      return
    }

    const action = target.dataset.action

    switch (action) {
      case 'start-session':
        store.startSession()
        return
      case 'begin-observe':
        store.beginObserve()
        return
      case 'match-visual':
        store.registerMatchAttempt('visual', performance.now())
        return
      case 'match-semantic':
        store.registerMatchAttempt('semantic', performance.now())
        return
      case 'submit-inference': {
        const optionId = target.dataset.optionId
        if (optionId) {
          store.submitInference(optionId)
        }
        return
      }
      case 'submit-reflection':
        await store.submitReflection()
        return
      case 'advance-round':
        store.advanceRound()
        return
      case 'toggle-ai':
        await store.cycleAiPreference()
        return
      case 'reset-menu':
        store.resetToMenu()
        return
    }
  })

  root.addEventListener('input', (event) => {
    const target = event.target as HTMLElement

    if (target instanceof HTMLInputElement && target.dataset.action === 'confidence') {
      store.setReflectionConfidence(Number(target.value))
      const label = target.closest('.slider-field')?.querySelector('span')
      if (label) {
        label.textContent = `Confidence: ${target.value}`
      }
    }

    if (target instanceof HTMLTextAreaElement && target.dataset.action === 'reflection-text') {
      store.setReflectionText(target.value)
    }
  })
}
