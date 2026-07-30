export type TimerPhase = 'focus' | 'break' | 'longBreak'
export type SessionStatus = 'idle' | 'running' | 'paused'
export type SoundBarrier = 'none' | 'pinkNoise' | 'classic' | 'loFi' | 'ambient'

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
  soundBarrier: SoundBarrier
  binauralEnabled: boolean
}

export type PanelId = 'settings' | 'sound' | 'queue' | 'about' | null

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
  soundBarrier: 'none',
  binauralEnabled: false,
}
