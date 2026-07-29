export type TimerPhase = 'focus' | 'break' | 'longBreak'
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
