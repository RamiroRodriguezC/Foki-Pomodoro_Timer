export type TimerPhase = 'focus' | 'break' | 'longBreak'
export type SessionStatus = 'idle' | 'running' | 'paused'

// Tipo viejo de SoundBarrier (eliminado en Fase 1):
// type SoundBarrier = 'none' | 'pinkNoise' | 'classic' | 'loFi' | 'ambient'
// Migración de store en Fase 2 necesita saber el shape anterior.

export type SoundCategory = 'silence' | 'ambient' | 'music'
export type MusicGenre = 'loFi' | 'classical' // 'piano' se agrega el día que exista assets/Sounds/SoundBarrier/Piano/

export interface SoundSelection {
  category: SoundCategory
  ambientTrackId: string | null   // id de track en AMBIENT_LIBRARY; null si category !== 'ambient'
  musicGenre: MusicGenre | null   // género en MUSIC_LIBRARY; null si category !== 'music'
}

export interface SessionConfig {
  focusMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  sessionsBeforeLongBreak: number
}

export interface SessionRecord {
  timestamp: number
  phase: TimerPhase
  durationMinutes: number
}

export interface Task {
  id: string
  text: string
  completed: boolean
  createdAt: number
  order: number
}

export interface AppSettings {
  config: SessionConfig
  soundSelection: SoundSelection
  volume: number            // 0 a 1
  autoSyncEnabled: boolean  // "Reproducción inteligente" — sync con fases del timer
  focusModeEnabled: boolean // "Focus Mode" — atenúa todo salvo dial y tarea #1 durante focus
  musicLoopEnabled: boolean // "Repetir canción" — loop de la pista actual en géneros de música (default OFF: las pistas avanzan solas)
  binauralEnabled: boolean  // sin tocar, ya existe
}

export type PanelId = 'settings' | 'sound' | 'tasks' | 'about' | null

// Estado del timer basado en timestamp absoluto (Regla dura #12).
// - 'idle': `phaseEndsAt` y `remainingSecondsPaused` son null. Sesión no iniciada.
// - 'running': `phaseEndsAt` tiene el timestamp de fin, `remainingSecondsPaused` es null.
// - 'paused': `remainingSecondsPaused` tiene los segundos restantes, `phaseEndsAt` es null.
export interface TimerState {
  phase: TimerPhase
  status: SessionStatus
  phaseEndsAt: number | null
  remainingSecondsPaused: number | null
  sessionsCompletedInCycle: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  config: {
    focusMinutes: 25,
    breakMinutes: 5,
    longBreakMinutes: 15,
    sessionsBeforeLongBreak: 4,
  },
  soundSelection: { category: 'silence', ambientTrackId: null, musicGenre: null },
  volume: 0.6,
  autoSyncEnabled: true,
  focusModeEnabled: true,
  musicLoopEnabled: false,
  binauralEnabled: false,
}
