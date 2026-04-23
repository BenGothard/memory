import type { EvidenceQuality } from '../simulation/types'

type TokenStyle = {
  label: string
  primary: number
  secondary: number
  shape: 'diamond' | 'circle' | 'hex' | 'ring' | 'triangle' | 'bars' | 'flare'
}

const TOKEN_STYLES: Record<string, TokenStyle> = {
  prism: { label: 'Prism', primary: 0x66d9ef, secondary: 0x16334a, shape: 'diamond' },
  lattice: { label: 'Lattice', primary: 0xffd166, secondary: 0x47361a, shape: 'bars' },
  pulse: { label: 'Pulse', primary: 0xff6b6b, secondary: 0x431d23, shape: 'ring' },
  glyph: { label: 'Glyph', primary: 0xf9f7f3, secondary: 0x243046, shape: 'hex' },
  helix: { label: 'Helix', primary: 0x95f9b3, secondary: 0x1d3e2e, shape: 'circle' },
  arc: { label: 'Arc', primary: 0xf7a072, secondary: 0x4a2617, shape: 'triangle' },
  flare: { label: 'Flare', primary: 0xc4b5fd, secondary: 0x2d2454, shape: 'flare' },
}

export function tokenStyle(token: string): TokenStyle {
  return TOKEN_STYLES[token] ?? TOKEN_STYLES.glyph
}

export function qualityColor(quality: EvidenceQuality): number {
  switch (quality) {
    case 'strong':
      return 0x95f9b3
    case 'mixed':
      return 0xffd166
    default:
      return 0xff6b6b
  }
}
