import type {
  CaseBand,
  CaseDefinition,
  EvidenceCard,
  ReflectionPrompt,
  SourceCue,
} from '../simulation/types'

function source(label: string, quality: SourceCue['quality'], note: string): SourceCue {
  return { label, quality, note }
}

function evidence(
  id: string,
  label: string,
  summary: string,
  visualToken: string,
  semanticToken: string,
  variable: string,
  numericSignal: string,
  cue: SourceCue,
  tags: string[],
): EvidenceCard {
  return {
    id,
    label,
    summary,
    visualToken,
    semanticToken,
    variable,
    numericSignal,
    source: cue,
    tags,
  }
}

function prompts(...items: string[]): ReflectionPrompt[] {
  return items.map((promptText, index) => ({
    id: `prompt-${index + 1}`,
    prompt: promptText,
    placeholder:
      index === 0
        ? 'Name the strongest signal you relied on.'
        : 'Describe what you would verify before acting.',
  }))
}

export const CASE_LIBRARY: CaseDefinition[] = [
  {
    id: 'greenhouse-shade-trial',
    band: 'beginner',
    title: 'Greenhouse Shade Trial',
    premise:
      'A horticulture lab wants to know whether basil leaf scorch is caused primarily by midday heat or nutrient mix variation.',
    focus: 'evidence-evaluation',
    evidenceSequence: [
      evidence(
        'shade-temp',
        'Temperature trace',
        'Beds under a 30% shade cloth stayed 4.2 C cooler at noon.',
        'prism',
        'cooler',
        'canopy temperature',
        '-4.2 C',
        source('Sensor array', 'strong', 'Calibrated across all beds.'),
        ['temperature-control', 'causal-signal'],
      ),
      evidence(
        'shade-moisture',
        'Moisture log',
        'Soil moisture stayed within 2% across control and shade groups.',
        'lattice',
        'equal-moisture',
        'soil moisture',
        '2% delta',
        source('Irrigation controller', 'strong', 'Automated drip system.'),
        ['controlled-variable', 'confound-check'],
      ),
      evidence(
        'shade-leaf',
        'Leaf score',
        'Scorch scores fell from 7.1 to 3.4 under shade after six days.',
        'pulse',
        'less-scorch',
        'leaf scorch',
        '-3.7 pts',
        source('Blind rater panel', 'strong', 'Two raters agreed on scores.'),
        ['outcome', 'replicated'],
      ),
      evidence(
        'fertilizer-forum',
        'Forum suggestion',
        'An online grower insists the fertilizer batch must be the real cause.',
        'glyph',
        'fertilizer',
        'fertilizer claim',
        'anecdotal',
        source('Grower forum', 'weak', 'No controlled comparison posted.'),
        ['anecdote', 'low-quality-source'],
      ),
    ],
    inference: {
      prompt: 'Which conclusion is best supported by the available evidence?',
      kind: 'best-supported',
      options: [
        {
          id: 'correct',
          text: 'Midday heat stress is the better explanation for the scorch reduction than fertilizer variation.',
          rationale:
            'Temperature changed while moisture stayed controlled, and scorch fell only in the shaded condition.',
        },
        {
          id: 'fertilizer',
          text: 'The fertilizer batch was almost certainly defective.',
          rationale: 'This relies on an uncontrolled anecdote and ignores the shaded comparison.',
        },
        {
          id: 'moisture',
          text: 'Lower soil moisture in the shade plots explains the effect.',
          rationale: 'The moisture log shows soil moisture was effectively equal.',
        },
        {
          id: 'no-effect',
          text: 'There is not enough evidence to prefer any explanation at all.',
          rationale: 'The controlled temperature change and outcome shift do support a provisional conclusion.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'The shade group stayed cooler while moisture remained controlled and scorch scores dropped substantially.',
      counterWeight: 'The fertilizer hypothesis comes only from an anecdotal source without a matched control.',
    },
    reflectionPrompts: prompts(
      'What controlled variable helped you dismiss the weaker fertilizer claim?',
      'What extra measurement would make the heat explanation even stronger?',
    ),
    rubricTags: ['control-variables', 'source-quality', 'causal-inference'],
    biasTags: ['anecdotal-bias', 'single-cause-fallacy'],
  },
  {
    id: 'salt-bridge-cell',
    band: 'beginner',
    title: 'Salt Bridge Cell',
    premise:
      'An electrochemistry class compares why one galvanic cell keeps producing current while a visually similar setup fails quickly.',
    focus: 'working-memory',
    evidenceSequence: [
      evidence(
        'bridge-kno3',
        'Bridge composition',
        'The working cell uses a KNO3 salt bridge between zinc and copper half-cells.',
        'helix',
        'kno3',
        'bridge ions',
        'KNO3',
        source('Lab notebook', 'strong', 'Recorded during setup.'),
        ['mechanism', 'ions'],
      ),
      evidence(
        'bridge-sugar',
        'Failed variant',
        'The failed variant replaced the salt bridge with sugar gel and voltage collapsed after 40 seconds.',
        'arc',
        'sugar-gel',
        'bridge replacement',
        '40 s',
        source('Bench video', 'mixed', 'Single failed replicate.'),
        ['comparison', 'conductivity'],
      ),
      evidence(
        'electrode-same',
        'Electrodes constant',
        'Both setups used the same zinc and copper strips from the same stock.',
        'lattice',
        'same-electrodes',
        'electrode identity',
        'matched',
        source('Equipment sheet', 'strong', 'Shared stock numbers.'),
        ['controlled-variable', 'materials'],
      ),
      evidence(
        'purity-blog',
        'Blog explanation',
        'A hobby blog claims copper purity differences are usually to blame in student cells.',
        'prism',
        'purity',
        'copper purity claim',
        'generic claim',
        source('Hobby blog', 'weak', 'No data from this setup.'),
        ['generic-advice', 'low-relevance'],
      ),
    ],
    inference: {
      prompt: 'What is the strongest inference about why the first cell maintained current?',
      kind: 'best-supported',
      options: [
        {
          id: 'correct',
          text: 'The salt bridge allowed ions to move and maintain charge balance, unlike the sugar gel replacement.',
          rationale: 'The bridge chemistry changed while the electrodes stayed constant.',
        },
        {
          id: 'purity',
          text: 'Copper purity changed enough to determine the outcome.',
          rationale: 'The electrodes were matched across both cells.',
        },
        {
          id: 'zinc-mass',
          text: 'The zinc strip must have been heavier in the working cell.',
          rationale: 'The evidence does not mention mass differences and points elsewhere.',
        },
        {
          id: 'no-mechanism',
          text: 'The result shows no mechanism, only luck.',
          rationale: 'The bridge replacement provides a plausible mechanistic contrast.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'The bridge chemistry changed and the cell failed only when the ionic pathway was replaced with sugar gel.',
      counterWeight: 'The generic blog post is not direct evidence about this experimental comparison.',
    },
    reflectionPrompts: prompts(
      'Which detail helped you track the actual manipulated variable?',
      'What second test would strengthen the ionic-charge explanation?',
    ),
    rubricTags: ['mechanistic-reasoning', 'controlled-comparison', 'working-memory'],
    biasTags: ['availability-bias', 'irrelevant-evidence'],
  },
  {
    id: 'enzyme-light-leak',
    band: 'beginner',
    title: 'Enzyme Light Leak',
    premise:
      'A biochemistry lab sees unexpectedly bright fluorescence in an enzyme plate assay and must decide whether the effect is biological or procedural.',
    focus: 'inhibition',
    evidenceSequence: [
      evidence(
        'covered-wells',
        'Covered wells',
        'Covered control wells stayed near baseline fluorescence throughout the run.',
        'pulse',
        'covered',
        'covered controls',
        'baseline',
        source('Plate reader export', 'strong', 'Timestamped instrument log.'),
        ['control', 'baseline'],
      ),
      evidence(
        'window-bench',
        'Bench position',
        'The brightest wells were on the side facing a sunlit window during setup.',
        'flare',
        'window-side',
        'bench location',
        'edge cluster',
        source('Lab photo', 'mixed', 'Single setup image.'),
        ['spatial-pattern', 'procedural'],
      ),
      evidence(
        'enzyme-stock',
        'Stock preparation',
        'Enzyme aliquots came from the same thawed batch for all wells.',
        'helix',
        'same-batch',
        'enzyme batch',
        'matched',
        source('Prep log', 'strong', 'Documented aliquot map.'),
        ['controlled-variable', 'batch'],
      ),
      evidence(
        'mentor-guess',
        'Mentor guess',
        'A mentor says bright signal usually means the enzyme accelerated.',
        'glyph',
        'faster-enzyme',
        'mentor claim',
        'heuristic',
        source('Hallway comment', 'weak', 'No direct measurement attached.'),
        ['authority-cue', 'untested-assumption'],
      ),
    ],
    inference: {
      prompt: 'Which explanation is best supported?',
      kind: 'best-supported',
      options: [
        {
          id: 'correct',
          text: 'Ambient light contamination during setup is the better-supported explanation than a true enzyme effect.',
          rationale: 'The spatial pattern and covered controls point to procedural light exposure, not stock differences.',
        },
        {
          id: 'enzyme',
          text: 'The enzyme reaction genuinely accelerated only in the bright wells.',
          rationale: 'The enzyme stock was matched and there is no direct kinetic evidence for selective acceleration.',
        },
        {
          id: 'batch',
          text: 'A different enzyme batch caused the fluorescence spike.',
          rationale: 'The prep log shows one shared batch.',
        },
        {
          id: 'reader-error',
          text: 'The reader malfunctioned uniformly for the entire plate.',
          rationale: 'The effect clustered on the window-facing edge rather than all wells.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'The bright wells clustered on the window-facing side while covered controls stayed near baseline.',
      counterWeight: 'The mentor comment is a generic heuristic, not data from this run.',
    },
    reflectionPrompts: prompts(
      'What tempting explanation did you have to inhibit before choosing?',
      'Which procedural safeguard would you add on the next run?',
    ),
    rubricTags: ['inhibitory-control', 'source-evaluation', 'procedural-reasoning'],
    biasTags: ['authority-bias', 'salience-bias'],
  },
  {
    id: 'shape-memory-wire',
    band: 'beginner',
    title: 'Shape Memory Wire',
    premise:
      'A materials team tests why a bent nickel-titanium wire returns to shape in one condition but not another.',
    focus: 'flexibility',
    evidenceSequence: [
      evidence(
        'warm-water',
        'Warm bath',
        'Bent wire returned to its original shape after immersion in 55 C water.',
        'arc',
        'warm-bath',
        'water temperature',
        '55 C',
        source('Demo camera', 'strong', 'Repeated in two trials.'),
        ['temperature', 'phase-transition'],
      ),
      evidence(
        'room-air',
        'Room air',
        'An identical wire left at 22 C stayed bent for ten minutes.',
        'lattice',
        'room-air',
        'ambient condition',
        '22 C',
        source('Timing log', 'strong', 'Matched exposure period.'),
        ['comparison', 'time'],
      ),
      evidence(
        'same-wire-spec',
        'Wire specification',
        'Both wires came from the same package and diameter rating.',
        'helix',
        'same-spec',
        'wire identity',
        'matched',
        source('Inventory sheet', 'strong', 'Same product code.'),
        ['controlled-variable', 'materials'],
      ),
      evidence(
        'surface-shine',
        'Surface shine note',
        'One observer thinks shinier surface finish caused the return.',
        'glyph',
        'shiny',
        'surface finish claim',
        'subjective',
        source('Observer note', 'weak', 'No measured finish data.'),
        ['appearance-bias', 'unsupported'],
      ),
    ],
    inference: {
      prompt: 'Which conclusion is most justified?',
      kind: 'best-supported',
      options: [
        {
          id: 'correct',
          text: 'The return to shape is best explained by the higher temperature triggering the alloy’s phase change.',
          rationale: 'Temperature differed while wire specification stayed constant.',
        },
        {
          id: 'surface',
          text: 'Surface shine determined whether the wire recovered.',
          rationale: 'The shine observation was subjective and unmeasured.',
        },
        {
          id: 'diameter',
          text: 'The wires must have had different diameters.',
          rationale: 'The inventory sheet shows the same diameter rating.',
        },
        {
          id: 'chance',
          text: 'The recovery was random and cannot be interpreted.',
          rationale: 'The warm-vs-room comparison supports a mechanistic explanation.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'Only the warm-water condition produced recovery, and the wire specification stayed constant.',
      counterWeight: 'The surface-finish note is subjective and does not outweigh the direct temperature contrast.',
    },
    reflectionPrompts: prompts(
      'How did you decide which visible detail was merely descriptive versus causal?',
      'What measurement would let you estimate the transition threshold more precisely?',
    ),
    rubricTags: ['mechanistic-inference', 'cognitive-flexibility', 'confound-rejection'],
    biasTags: ['surface-level-reasoning', 'chance-neglect'],
  },
  {
    id: 'algae-nitrogen-bloom',
    band: 'intermediate',
    title: 'Algae Nitrogen Bloom',
    premise:
      'A freshwater ecology team needs to determine why one pond segment developed a rapid algae bloom after runoff season.',
    focus: 'evidence-evaluation',
    evidenceSequence: [
      evidence(
        'nitrate-spike',
        'Nitrate assay',
        'Nitrate concentration tripled in the bloom zone two days before chlorophyll surged.',
        'prism',
        'nitrate-spike',
        'nitrate level',
        '3x',
        source('Water assay', 'strong', 'Triplicate sampling.'),
        ['leading-indicator', 'temporal-order'],
      ),
      evidence(
        'phosphate-flat',
        'Phosphate assay',
        'Phosphate stayed close to baseline in both bloom and non-bloom zones.',
        'lattice',
        'phosphate-flat',
        'phosphate level',
        'flat',
        source('Water assay', 'strong', 'Same assay batch.'),
        ['controlled-contrast', 'nutrients'],
      ),
      evidence(
        'storm-ditch',
        'Storm ditch map',
        'The bloom zone sits nearest a drainage ditch from a fertilized test field.',
        'helix',
        'ditch',
        'ditch proximity',
        'nearest',
        source('GIS map', 'mixed', 'Correlation, not intervention.'),
        ['spatial-link', 'possible-source'],
      ),
      evidence(
        'sunshine-rumor',
        'Weather rumor',
        'A local paddler insists the bloom came from a week of extra sunshine.',
        'glyph',
        'sunshine',
        'sunshine rumor',
        'anecdotal',
        source('Dock interview', 'weak', 'No comparative light record.'),
        ['anecdote', 'folk-explanation'],
      ),
    ],
    inference: {
      prompt: 'Which claim is best supported by the pattern of evidence?',
      kind: 'best-supported',
      options: [
        {
          id: 'correct',
          text: 'Nitrogen-rich runoff is the strongest current explanation for the bloom.',
          rationale: 'The nitrate spike preceded the bloom and aligns with ditch proximity.',
        },
        {
          id: 'phosphate',
          text: 'Phosphate overload triggered the bloom.',
          rationale: 'Phosphate remained flat across zones.',
        },
        {
          id: 'sunshine',
          text: 'Extra sunshine is the main explanation.',
          rationale: 'That claim is anecdotal and lacks comparative records.',
        },
        {
          id: 'fish',
          text: 'Fish migration likely caused the chlorophyll spike.',
          rationale: 'No fish evidence is presented.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'The nitrate spike came before the bloom and the affected zone is closest to the fertilized runoff source.',
      counterWeight: 'Phosphate stayed flat, and the sunshine claim lacks direct measurement.',
    },
    reflectionPrompts: prompts(
      'Why does temporal order matter in this pond case?',
      'What extra evidence would distinguish runoff from another nitrogen source?',
    ),
    rubricTags: ['temporal-reasoning', 'base-rate-control', 'source-quality'],
    biasTags: ['post-hoc-fallacy', 'folk-explanation'],
  },
  {
    id: 'catalyst-contamination',
    band: 'intermediate',
    title: 'Catalyst Contamination Check',
    premise:
      'A chemistry group observes erratic reaction speed after swapping catalyst jars and must isolate whether the new catalyst or contamination is responsible.',
    focus: 'inhibition',
    evidenceSequence: [
      evidence(
        'new-jar-fast',
        'Fresh jar run',
        'The new jar doubled reaction rate in the first run but performance decayed sharply in later runs.',
        'pulse',
        'fast-then-fade',
        'rate pattern',
        '2x then drop',
        source('Kinetics export', 'strong', 'Four runs logged.'),
        ['time-series', 'pattern-shift'],
      ),
      evidence(
        'spatula-residue',
        'Tool residue',
        'A reused spatula carried trace chloride residue into the catalyst jar.',
        'flare',
        'chloride',
        'tool contamination',
        'trace detected',
        source('Residue swab', 'strong', 'Positive chloride strip.'),
        ['contamination', 'procedural'],
      ),
      evidence(
        'sealed-control',
        'Sealed control',
        'A sealed reserve sample from the same catalyst lot produced stable rates across runs.',
        'helix',
        'sealed-control',
        'reserve sample',
        'stable',
        source('Control notebook', 'strong', 'Same lot number.'),
        ['controlled-comparison', 'lot-check'],
      ),
      evidence(
        'new-label',
        'Relabeled jar',
        'The new jar had a different handwritten label color than the previous batch.',
        'glyph',
        'label-color',
        'jar appearance',
        'blue label',
        source('Bench photo', 'weak', 'Purely descriptive detail.'),
        ['salient-detail', 'irrelevant'],
      ),
    ],
    inference: {
      prompt: 'What is the best-supported explanation for the erratic rates?',
      kind: 'best-supported',
      options: [
        {
          id: 'correct',
          text: 'Contamination introduced during handling is more likely than an inherently bad catalyst lot.',
          rationale: 'The sealed reserve from the same lot stayed stable and residue was detected on the reused tool.',
        },
        {
          id: 'lot-bad',
          text: 'The catalyst lot itself was defective.',
          rationale: 'The stable reserve sample argues against that explanation.',
        },
        {
          id: 'label-color',
          text: 'The blue label indicates the catalyst had a different formulation.',
          rationale: 'Label color is not mechanistic evidence.',
        },
        {
          id: 'noisy-equipment',
          text: 'Random sensor noise explains the rates.',
          rationale: 'The contamination signal and reserve comparison provide a stronger account.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'The reserve sample from the same lot stayed stable, while residue testing found chloride on the reused tool.',
      counterWeight: 'The label-color detail is salient but irrelevant to the reaction mechanism.',
    },
    reflectionPrompts: prompts(
      'What eye-catching clue had to be ignored to make the better inference?',
      'How would you redesign the workflow to prevent this confound next time?',
    ),
    rubricTags: ['confound-detection', 'inhibitory-control', 'evidence-weighting'],
    biasTags: ['salience-bias', 'representativeness'],
  },
  {
    id: 'telescope-sensor-noise',
    band: 'intermediate',
    title: 'Telescope Sensor Noise',
    premise:
      'An astronomy team spots a repeating dimming event and must decide whether it is a plausible exoplanet signal or a sensor artifact.',
    focus: 'working-memory',
    evidenceSequence: [
      evidence(
        'periodicity',
        'Periodic dip',
        'The dimming repeats every 5.8 days over six observation windows.',
        'arc',
        '5-8-days',
        'periodicity',
        '5.8 d',
        source('Light curve fit', 'strong', 'Consistent recurrence.'),
        ['periodic-signal', 'repeatability'],
      ),
      evidence(
        'weather-correlation',
        'Weather match',
        'Two deeper dips occurred during nights with thin cirrus and poor guiding.',
        'lattice',
        'cirrus',
        'weather correlation',
        '2 nights',
        source('Observing log', 'mixed', 'Matches some but not all dips.'),
        ['partial-confound', 'noise'],
      ),
      evidence(
        'comparison-star',
        'Comparison star',
        'Nearby comparison stars stayed flat during four of the six dimming events.',
        'prism',
        'flat-comparison',
        'comparison signal',
        'flat in 4/6',
        source('Photometry notebook', 'strong', 'Standard differential check.'),
        ['artifact-check', 'reference'],
      ),
      evidence(
        'online-thread',
        'Online thread',
        'A forum user says all periodic dimming is usually detector drift.',
        'glyph',
        'detector-drift',
        'forum claim',
        'generic',
        source('Astronomy forum', 'weak', 'Not tied to these data.'),
        ['generic-claim', 'low-specificity'],
      ),
    ],
    inference: {
      prompt: 'What is the strongest current inference?',
      kind: 'counter-hypothesis',
      options: [
        {
          id: 'correct',
          text: 'A recurring astrophysical signal remains plausible, but weather-linked artifact risk still needs follow-up on the two noisy nights.',
          rationale: 'The periodicity and mostly flat comparison stars support signal plausibility, while cirrus nights warn against overclaiming.',
        },
        {
          id: 'artifact-only',
          text: 'The event is entirely explained by detector drift.',
          rationale: 'That overstates a generic forum claim and ignores periodicity plus flat comparison stars.',
        },
        {
          id: 'confirmed-planet',
          text: 'The team has already confirmed an exoplanet.',
          rationale: 'The mixed weather evidence means confirmation is premature.',
        },
        {
          id: 'nothing-there',
          text: 'There is no signal of interest at all.',
          rationale: 'The repeating 5.8-day pattern still warrants continued investigation.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'The 5.8-day recurrence and mostly flat comparison stars support a real signal, but weather correlation on two nights prevents a stronger claim.',
      counterWeight: 'A cautious counter-hypothesis about weather artifacts still has to be considered.',
    },
    reflectionPrompts: prompts(
      'Which piece of mixed evidence kept this from being a full confirmation?',
      'What follow-up observation would most cleanly separate signal from artifact?',
    ),
    rubricTags: ['counter-hypothesis', 'uncertainty-tolerance', 'working-memory-updating'],
    biasTags: ['premature-closure', 'binary-thinking'],
  },
  {
    id: 'sleep-caffeine-trial',
    band: 'intermediate',
    title: 'Sleep and Caffeine Trial',
    premise:
      'A cognitive science lab compares whether a memory improvement came from caffeine dose or from better sleep in one participant subgroup.',
    focus: 'metacognition',
    evidenceSequence: [
      evidence(
        'caffeine-dose',
        'Dose record',
        'Both groups received the same caffeine dose by body mass.',
        'helix',
        'same-dose',
        'caffeine dose',
        'matched',
        source('Protocol sheet', 'strong', 'Fixed by mass.'),
        ['controlled-variable', 'dose'],
      ),
      evidence(
        'sleep-logs',
        'Sleep logs',
        'The improved subgroup averaged 78 more minutes of sleep the prior night.',
        'pulse',
        'more-sleep',
        'sleep duration',
        '+78 min',
        source('Actigraphy summary', 'strong', 'Wearable-verified.'),
        ['confound', 'sleep'],
      ),
      evidence(
        'timing-jitter',
        'Test timing',
        'Testing started within a 15-minute window for everyone.',
        'arc',
        'same-time',
        'test timing',
        '15 min',
        source('Schedule export', 'strong', 'Timestamps matched.'),
        ['controlled-variable', 'circadian'],
      ),
      evidence(
        'coffee-fan',
        'Participant quote',
        'One participant says caffeine always makes them brilliant at recall tasks.',
        'glyph',
        'coffee-quote',
        'participant belief',
        'self-report',
        source('Debrief quote', 'weak', 'Subjective expectancy.'),
        ['expectancy-bias', 'anecdote'],
      ),
    ],
    inference: {
      prompt: 'What should the team infer first before claiming a caffeine benefit?',
      kind: 'missing-evidence',
      options: [
        {
          id: 'correct',
          text: 'They should account for sleep differences, because better sleep is a viable confound for the improved subgroup.',
          rationale: 'Dose and timing were controlled, but sleep differed substantially.',
        },
        {
          id: 'quote',
          text: 'The participant quote is enough to confirm a caffeine effect.',
          rationale: 'That is an expectancy-laden anecdote, not controlled evidence.',
        },
        {
          id: 'timing',
          text: 'Testing time differences explain the pattern.',
          rationale: 'Test timing was tightly matched.',
        },
        {
          id: 'caffeine-proven',
          text: 'Equal caffeine dosing proves caffeine caused the memory gain.',
          rationale: 'Equal dosing removes one confound; it does not prove causality in the presence of sleep differences.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'Sleep differed meaningfully while caffeine dose and test timing were controlled.',
      counterWeight: 'The participant quote is a weak expectancy-based cue, not a substitute for the missing control.',
    },
    reflectionPrompts: prompts(
      'What assumption would have led you to over-credit the caffeine dose?',
      'How did confidence calibration matter in a case with an obvious anecdote?',
    ),
    rubricTags: ['metacognition', 'confound-detection', 'missing-evidence'],
    biasTags: ['expectancy-bias', 'causal-overreach'],
  },
  {
    id: 'reef-microplastic-shift',
    band: 'advanced',
    title: 'Reef Microplastic Shift',
    premise:
      'Marine biologists are evaluating why juvenile reef fish changed feeding patterns near one coastal inlet during a month-long survey.',
    focus: 'evidence-evaluation',
    evidenceSequence: [
      evidence(
        'plastic-density',
        'Particle density',
        'Microplastic density rose 5x near the inlet after two storm events.',
        'prism',
        'fivefold',
        'particle density',
        '5x',
        source('Water filtration lab', 'strong', 'Triplicate filter counts.'),
        ['environmental-shift', 'temporal-order'],
      ),
      evidence(
        'prey-drop',
        'Prey counts',
        'Zooplankton abundance fell 38% in the same zone during the survey period.',
        'pulse',
        'prey-drop',
        'prey availability',
        '-38%',
        source('Plankton tow summary', 'strong', 'Repeated transects.'),
        ['food-web', 'co-occurrence'],
      ),
      evidence(
        'boat-noise',
        'Boat traffic',
        'Boat traffic also increased modestly on weekends near the inlet.',
        'arc',
        'boat-noise',
        'boat traffic',
        '+12%',
        source('Harbor log', 'mixed', 'Weekend clustering only.'),
        ['alternative-factor', 'partial-confound'],
      ),
      evidence(
        'viral-video',
        'Viral explainer',
        'A viral video claims fish always avoid any water with visible debris.',
        'glyph',
        'viral-video',
        'viral claim',
        'oversimplified',
        source('Short-form video', 'weak', 'No citations or field data.'),
        ['overgeneralization', 'low-quality-source'],
      ),
      evidence(
        'turbidity-flat',
        'Turbidity log',
        'Overall turbidity stayed near seasonal average across survey sites.',
        'helix',
        'turbidity-flat',
        'water clarity',
        'seasonal avg',
        source('Station buoy', 'strong', 'Continuous monitoring.'),
        ['control', 'ruling-out'],
      ),
    ],
    inference: {
      prompt: 'Which interpretation best fits the mixed evidence?',
      kind: 'counter-hypothesis',
      options: [
        {
          id: 'correct',
          text: 'Microplastic-linked ecological disruption is plausible, but prey decline and weekend boat noise should still be disentangled before making a single-cause claim.',
          rationale: 'The strongest answer keeps the inlet shift meaningful without collapsing multiple plausible mechanisms into one story.',
        },
        {
          id: 'plastics-only',
          text: 'Microplastics alone fully explain the feeding change.',
          rationale: 'That ignores prey decline and a partial boat-noise confound.',
        },
        {
          id: 'boats-only',
          text: 'Boat noise is clearly the sole cause.',
          rationale: 'Boat traffic increased only modestly on weekends while other environmental shifts were stronger and more persistent.',
        },
        {
          id: 'video',
          text: 'The viral video settles the question because fish dislike visible debris.',
          rationale: 'The video is oversimplified and uncited.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'Particle density and prey availability shifted meaningfully, but multiple plausible mechanisms remain in play.',
      counterWeight: 'Weekend boat traffic is a partial confound that prevents a neat single-cause story.',
    },
    reflectionPrompts: prompts(
      'What kept this case from collapsing into a one-variable explanation?',
      'How would you design the next sampling week to separate prey effects from traffic effects?',
    ),
    rubricTags: ['multicausal-reasoning', 'counter-hypothesis', 'source-quality'],
    biasTags: ['single-cause-fallacy', 'overgeneralization'],
  },
  {
    id: 'exoplanet-aliasing',
    band: 'advanced',
    title: 'Exoplanet Aliasing Problem',
    premise:
      'A survey team sees radial velocity oscillations and must decide whether the candidate planet period is genuine or an alias created by the sampling schedule.',
    focus: 'working-memory',
    evidenceSequence: [
      evidence(
        'rv-period',
        'Velocity fit',
        'The strongest fit shows a 12.1-day oscillation with moderate amplitude.',
        'flare',
        '12-1-days',
        'velocity period',
        '12.1 d',
        source('Pipeline fit', 'strong', 'Cross-checked in two fitters.'),
        ['candidate-signal', 'model-fit'],
      ),
      evidence(
        'window-function',
        'Sampling cadence',
        'Observation gaps create a strong 24-hour alias in the window function.',
        'lattice',
        '24h-alias',
        'sampling cadence',
        'daily alias',
        source('Cadence analysis', 'strong', 'Derived from actual timestamps.'),
        ['alias-risk', 'methodological'],
      ),
      evidence(
        'activity-index',
        'Stellar activity',
        'The stellar activity index stays flat across the strongest velocity swings.',
        'pulse',
        'flat-activity',
        'activity index',
        'flat',
        source('Spectral index log', 'strong', 'Same observing windows.'),
        ['alternative-hypothesis', 'ruling-out'],
      ),
      evidence(
        'blog-confidence',
        'Popular article',
        'A popular article says any clean sinusoid in radial velocity almost always means a planet.',
        'glyph',
        'planet-always',
        'popular article',
        'overstated',
        source('News article', 'weak', 'Not methodological guidance.'),
        ['media-simplification', 'overclaim'],
      ),
      evidence(
        'resample-test',
        'Bootstrap resample',
        'Resampling weakens the 12.1-day peak but does not erase it.',
        'helix',
        'resample',
        'bootstrap stability',
        'weaker, survives',
        source('Resample report', 'mixed', 'Suggestive, not decisive.'),
        ['robustness', 'uncertainty'],
      ),
    ],
    inference: {
      prompt: 'Which judgment best matches the evidence?',
      kind: 'counter-hypothesis',
      options: [
        {
          id: 'correct',
          text: 'The 12.1-day signal is interesting but not yet secure; alias risk remains live even though stellar activity is less likely.',
          rationale: 'This integrates the strongest positive and cautionary evidence without overcommitting.',
        },
        {
          id: 'confirmed',
          text: 'The planet is confirmed because the activity index is flat.',
          rationale: 'Flat activity rules out one alternative, not all alias explanations.',
        },
        {
          id: 'alias-certain',
          text: 'The signal must be an alias and is not worth further follow-up.',
          rationale: 'The resample signal and fitted period still justify cautious follow-up.',
        },
        {
          id: 'article',
          text: 'The popular article makes the clean sinusoid decisive.',
          rationale: 'That article overstates what the method can tell us.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'Alias risk from cadence is real, while flat stellar activity removes only one competing explanation.',
      counterWeight: 'The surviving resample peak means the candidate should not be discarded outright.',
    },
    reflectionPrompts: prompts(
      'How did you hold both the positive and cautionary signals in mind at once?',
      'What new observation pattern would most reduce alias risk?',
    ),
    rubricTags: ['uncertainty-management', 'working-memory-updating', 'methodological-rigor'],
    biasTags: ['premature-certainty', 'media-amplification'],
  },
  {
    id: 'fusion-coil-quench',
    band: 'advanced',
    title: 'Fusion Coil Quench',
    premise:
      'An engineering team investigates why a superconducting test coil quenched during a promising high-field run.',
    focus: 'flexibility',
    evidenceSequence: [
      evidence(
        'current-spike',
        'Current trace',
        'Coil current spiked 6% above plan in the two seconds before the quench.',
        'arc',
        'current-spike',
        'coil current',
        '+6%',
        source('Power trace', 'strong', 'Millisecond resolution.'),
        ['direct-signal', 'timing'],
      ),
      evidence(
        'coolant-dip',
        'Coolant flow',
        'Coolant flow dipped 9% after a valve oscillation three seconds earlier.',
        'prism',
        'coolant-dip',
        'coolant flow',
        '-9%',
        source('Cryo monitor', 'strong', 'Synchronized with power trace.'),
        ['possible-cause', 'timing'],
      ),
      evidence(
        'sensor-replace',
        'Sensor note',
        'A temperature sensor was replaced the morning of the run and may be slightly noisy.',
        'glyph',
        'sensor-noise',
        'sensor swap',
        'possible noise',
        source('Maintenance note', 'mixed', 'No calibration drift measured yet.'),
        ['instrumentation', 'possible-confound'],
      ),
      evidence(
        'dry-run',
        'Dry run',
        'A low-current dry run after the sensor replacement completed without issue.',
        'helix',
        'dry-run',
        'post-maintenance check',
        'passed',
        source('Commissioning log', 'strong', 'Same sensor configuration.'),
        ['cross-check', 'ruling-out'],
      ),
      evidence(
        'manager-hunch',
        'Manager hunch',
        'A manager says quenches usually mean the operator pushed the coil too hard.',
        'pulse',
        'operator-hunch',
        'manager claim',
        'heuristic',
        source('Meeting note', 'weak', 'No specific evidence attached.'),
        ['authority-heuristic', 'blame-cue'],
      ),
    ],
    inference: {
      prompt: 'Which explanation deserves priority in the postmortem?',
      kind: 'missing-evidence',
      options: [
        {
          id: 'correct',
          text: 'The team should investigate the interaction between elevated current and reduced coolant flow before blaming sensor noise or operator behavior.',
          rationale: 'Those are the strongest timed signals, and the dry run weakens the sensor-only explanation.',
        },
        {
          id: 'operator',
          text: 'The operator is the most likely cause because managers see this pattern often.',
          rationale: 'That is a blame heuristic without direct evidence.',
        },
        {
          id: 'sensor-only',
          text: 'The replacement sensor alone probably caused a false quench.',
          rationale: 'The dry run after replacement argues against a simple sensor-only explanation.',
        },
        {
          id: 'nothing',
          text: 'There is no meaningful signal in the data.',
          rationale: 'The synchronized current and coolant deviations are meaningful signals.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'The coil saw a current overshoot and coolant dip in the seconds leading into the quench, while the post-maintenance dry run passed.',
      counterWeight: 'The replacement sensor remains relevant, but it is not the strongest first explanation.',
    },
    reflectionPrompts: prompts(
      'What made it important to resist the blame-heavy explanation?',
      'Which missing test would best separate a thermal failure from an instrumentation issue?',
    ),
    rubricTags: ['systems-thinking', 'cognitive-flexibility', 'missing-evidence'],
    biasTags: ['blame-bias', 'authority-bias'],
  },
  {
    id: 'soil-runoff-antibiotic',
    band: 'advanced',
    title: 'Soil Runoff Antibiotic',
    premise:
      'Environmental microbiologists are trying to explain a jump in resistant soil bacteria near a livestock runoff channel.',
    focus: 'metacognition',
    evidenceSequence: [
      evidence(
        'resistance-map',
        'Resistance counts',
        'Resistant colonies doubled within 20 meters of the runoff channel after heavy rain.',
        'pulse',
        'double-colonies',
        'resistant colonies',
        '2x',
        source('Plate assay', 'strong', 'Repeated across three transects.'),
        ['spatial-gradient', 'outcome'],
      ),
      evidence(
        'antibiotic-residue',
        'Residue assay',
        'Trace tetracycline residues were detected in runoff sediment samples.',
        'helix',
        'tetracycline',
        'antibiotic residue',
        'trace present',
        source('Mass spec report', 'strong', 'Above detection threshold.'),
        ['mechanistic-link', 'chemical-evidence'],
      ),
      evidence(
        'ph-shift',
        'Soil pH',
        'Soil pH near the channel was slightly lower than upland controls.',
        'arc',
        'ph-lower',
        'soil pH',
        '-0.4',
        source('Field probe', 'mixed', 'Small but consistent shift.'),
        ['alternative-factor', 'context'],
      ),
      evidence(
        'news-claim',
        'Headline claim',
        'A headline says resistant bacteria are always driven by antibiotic contamination.',
        'glyph',
        'headline-always',
        'headline framing',
        'always',
        source('News headline', 'weak', 'Oversimplified causal language.'),
        ['absolute-language', 'media-bias'],
      ),
      evidence(
        'uphill-control',
        'Uphill control',
        'Matched upland samples from the same farm showed no comparable post-rain jump.',
        'prism',
        'upland-flat',
        'upland control',
        'flat',
        source('Field notebook', 'strong', 'Sampled on same day.'),
        ['control', 'comparison'],
      ),
    ],
    inference: {
      prompt: 'Which interpretation is strongest right now?',
      kind: 'best-supported',
      options: [
        {
          id: 'correct',
          text: 'Runoff-linked antibiotic exposure is a strong working explanation, but soil chemistry and other stressors still deserve follow-up before making an absolute claim.',
          rationale: 'Residue plus the spatial gradient support the explanation, while pH shift and the limits of field data argue for caution.',
        },
        {
          id: 'headline',
          text: 'The headline settles it: contamination always causes resistance spikes.',
          rationale: 'Absolute media language is not a scientific conclusion.',
        },
        {
          id: 'ph-only',
          text: 'Soil pH alone clearly explains the resistance jump.',
          rationale: 'The pH shift is modest and does not account for the residue evidence.',
        },
        {
          id: 'no-link',
          text: 'There is no meaningful link to runoff at all.',
          rationale: 'The gradient, residue, and upland control argue against that dismissal.',
        },
      ],
      correctOptionId: 'correct',
      strongestEvidence:
        'Residue was detected near the channel, resistant colonies rose there after rain, and matched upland controls stayed flat.',
      counterWeight: 'The modest pH shift still matters as a possible contributing factor.',
    },
    reflectionPrompts: prompts(
      'Where did you notice yourself wanting to simplify a messy field case too quickly?',
      'What confidence level was justified given the mixed field evidence?',
    ),
    rubricTags: ['confidence-calibration', 'multifactor-reasoning', 'metacognition'],
    biasTags: ['absolute-thinking', 'oversimplification'],
  },
]

const BAND_ORDER: CaseBand[] = ['beginner', 'intermediate', 'advanced']

export function casesForBand(maxBand: CaseBand): CaseDefinition[] {
  const maxIndex = BAND_ORDER.indexOf(maxBand)
  return CASE_LIBRARY.filter((item) => BAND_ORDER.indexOf(item.band) <= maxIndex)
}

export function validateCaseDefinition(caseDefinition: CaseDefinition): string[] {
  const issues: string[] = []

  if (caseDefinition.evidenceSequence.length < 4) {
    issues.push(`${caseDefinition.id} needs at least four evidence cards.`)
  }

  if (caseDefinition.inference.options.length < 4) {
    issues.push(`${caseDefinition.id} needs at least four inference options.`)
  }

  const optionIds = new Set(caseDefinition.inference.options.map((option) => option.id))
  if (!optionIds.has(caseDefinition.inference.correctOptionId)) {
    issues.push(`${caseDefinition.id} must include its correct option in the option list.`)
  }

  if (caseDefinition.rubricTags.length < 2) {
    issues.push(`${caseDefinition.id} needs at least two rubric tags.`)
  }

  if (caseDefinition.biasTags.length < 1) {
    issues.push(`${caseDefinition.id} needs at least one bias tag.`)
  }

  return issues
}
