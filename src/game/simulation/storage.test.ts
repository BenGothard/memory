import { describe, expect, it } from 'vitest'

import { createDefaultProfile, createMemoryStorage, loadProfile, saveProfile } from './storage'

describe('profile storage', () => {
  it('creates a safe default profile when storage is empty', () => {
    const storage = createMemoryStorage()
    const profile = loadProfile(storage)

    expect(profile.unlockedBand).toBe('beginner')
    expect(profile.savedSettings.aiPreference).toBe('auto')
  })

  it('round-trips a saved profile', () => {
    const storage = createMemoryStorage()
    const profile = createDefaultProfile()
    profile.streak = 3
    profile.savedSettings.aiPreference = 'rule'

    saveProfile(storage, profile)
    const loaded = loadProfile(storage)

    expect(loaded.streak).toBe(3)
    expect(loaded.savedSettings.aiPreference).toBe('rule')
  })
})
