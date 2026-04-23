import type { PlayerProfile, SavedSettings } from './types'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

const PROFILE_STORAGE_KEY = 'signal-lab-profile-v1'

function defaultSettings(): SavedSettings {
  return {
    aiPreference: 'auto',
    reducedMotion: false,
    audioEnabled: true,
  }
}

export function createDefaultProfile(): PlayerProfile {
  return {
    streak: 0,
    weeklyMinutes: 0,
    unlockedBand: 'beginner',
    commonReasoningErrors: [],
    caseMastery: {},
    savedSettings: defaultSettings(),
    coachingHistorySummary: [],
    totalRounds: 0,
    totalPlayMinutes: 0,
  }
}

export function createBrowserStorage(): StorageLike {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }

  return createMemoryStorage()
}

export function createMemoryStorage(
  initialEntries?: Record<string, string>,
): StorageLike & { snapshot(): Record<string, string> } {
  const data = new Map(Object.entries(initialEntries ?? {}))

  return {
    getItem(key) {
      return data.get(key) ?? null
    },
    setItem(key, value) {
      data.set(key, value)
    },
    removeItem(key) {
      data.delete(key)
    },
    snapshot() {
      return Object.fromEntries(data.entries())
    },
  }
}

export function loadProfile(storage: StorageLike): PlayerProfile {
  const raw = storage.getItem(PROFILE_STORAGE_KEY)
  if (!raw) {
    return createDefaultProfile()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>
    return {
      ...createDefaultProfile(),
      ...parsed,
      savedSettings: {
        ...defaultSettings(),
        ...(parsed.savedSettings ?? {}),
      },
    }
  } catch {
    return createDefaultProfile()
  }
}

export function saveProfile(storage: StorageLike, profile: PlayerProfile): void {
  storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile))
}
