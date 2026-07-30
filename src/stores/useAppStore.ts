import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { storage } from '../services/storage'
import {
  AppSettings,
  DEFAULT_SETTINGS,
  PanelId,
  SessionConfig,
  SessionRecord,
  SoundBarrier,
  TimerPhase,
  TimerState,
} from '../types'

interface AppStoreState {
  settings: AppSettings
  timer: TimerState
  history: SessionRecord[]
  activePanel: PanelId
}

interface AppStoreActions {
  // Timer
  startFocus: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  skipPhase: () => void
  completePhase: () => void
  resetTimer: () => void
  getRemainingSeconds: () => number
  // Settings
  updateSessionConfig: (partial: Partial<SessionConfig>) => void
  setSoundBarrier: (soundBarrier: SoundBarrier) => void
  setBinauralEnabled: (enabled: boolean) => void
  // Paneles (máx. 2 niveles: pantalla principal → panel — Regla dura #4)
  openPanel: (panel: Exclude<PanelId, null>) => void
  closePanel: () => void
}

export type AppStore = AppStoreState & AppStoreActions

const initialTimer: TimerState = {
  phase: 'focus',
  isRunning: false,
  phaseEndsAt: null,
  remainingSecondsPaused: null,
  sessionsCompletedInCycle: 0,
}

const phaseDurationMinutes = (phase: TimerPhase, config: SessionConfig): number => {
  switch (phase) {
    case 'focus':
      return config.focusMinutes
    case 'break':
      return config.breakMinutes
    case 'longBreak':
      return config.longBreakMinutes
  }
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      timer: initialTimer,
      history: [],
      activePanel: null,

      startFocus: () => {
        const { settings, timer } = get()
        const minutes = phaseDurationMinutes('focus', settings.config)
        set({
          timer: {
            phase: 'focus',
            isRunning: true,
            phaseEndsAt: Date.now() + minutes * 60_000,
            remainingSecondsPaused: null,
            sessionsCompletedInCycle: timer.sessionsCompletedInCycle,
          },
        })
      },

      pauseTimer: () => {
        const { timer } = get()
        if (!timer.isRunning || timer.phaseEndsAt === null) return
        const remainingSecondsPaused = Math.max(
          0,
          Math.round((timer.phaseEndsAt - Date.now()) / 1000)
        )
        set({
          timer: {
            ...timer,
            isRunning: false,
            phaseEndsAt: null,
            remainingSecondsPaused,
          },
        })
      },

      resumeTimer: () => {
        const { timer } = get()
        if (timer.isRunning || timer.remainingSecondsPaused === null) return
        set({
          timer: {
            ...timer,
            isRunning: true,
            phaseEndsAt: Date.now() + timer.remainingSecondsPaused * 1000,
            remainingSecondsPaused: null,
          },
        })
      },

      skipPhase: () => {
        get().completePhase()
      },

      completePhase: () => {
        const { timer, settings, history } = get()
        const record: SessionRecord = {
          timestamp: Date.now(),
          phase: timer.phase,
          durationMinutes: phaseDurationMinutes(timer.phase, settings.config),
        }

        let sessionsCompletedInCycle = timer.sessionsCompletedInCycle
        let upcomingPhase: TimerPhase

        if (timer.phase === 'focus') {
          sessionsCompletedInCycle += 1
          upcomingPhase =
            sessionsCompletedInCycle % settings.config.sessionsBeforeLongBreak === 0
              ? 'longBreak'
              : 'break'
        } else if (timer.phase === 'longBreak') {
          sessionsCompletedInCycle = 0
          upcomingPhase = 'focus'
        } else {
          upcomingPhase = 'focus'
        }

        const nextMinutes = phaseDurationMinutes(upcomingPhase, settings.config)

        set({
          history: [...history, record],
          timer: {
            phase: upcomingPhase,
            isRunning: true,
            phaseEndsAt: Date.now() + nextMinutes * 60_000,
            remainingSecondsPaused: null,
            sessionsCompletedInCycle,
          },
        })
      },

      resetTimer: () => set({ timer: initialTimer }),

      getRemainingSeconds: () => {
        const { timer, settings } = get()
        if (timer.isRunning && timer.phaseEndsAt !== null) {
          return Math.max(0, Math.round((timer.phaseEndsAt - Date.now()) / 1000))
        }
        if (timer.remainingSecondsPaused !== null) {
          return timer.remainingSecondsPaused
        }
        return phaseDurationMinutes(timer.phase, settings.config) * 60
      },

      updateSessionConfig: (partial) => {
        set((state) => ({
          settings: { ...state.settings, config: { ...state.settings.config, ...partial } },
        }))
      },

      setSoundBarrier: (soundBarrier) => {
        set((state) => ({ settings: { ...state.settings, soundBarrier } }))
      },

      setBinauralEnabled: (binauralEnabled) => {
        set((state) => ({ settings: { ...state.settings, binauralEnabled } }))
      },

      openPanel: (panel) => set({ activePanel: panel }),
      closePanel: () => set({ activePanel: null }),
    }),
    {
      name: 'foki-app-storage',
      storage: createJSONStorage(() => storage),
      // `activePanel` es estado de UI efímero: no se persiste.
      partialize: (state) => ({
        settings: state.settings,
        timer: state.timer,
        history: state.history,
      }),
    }
  )
)
