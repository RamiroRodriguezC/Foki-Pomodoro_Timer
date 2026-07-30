import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { storage } from '../services/storage'
import {
  AppSettings,
  DEFAULT_SETTINGS,
  PanelId,
  SessionConfig,
  SessionRecord,
  SessionStatus,
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
  startCurrentPhase: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  skipPhase: () => void
  completePhase: () => void
  resetTimer: () => void
  getRemainingSeconds: () => number
  cyclePhase: () => void
  // Settings
  updateSessionConfig: (partial: Partial<SessionConfig>) => void
  setSoundBarrier: (soundBarrier: SoundBarrier) => void
  setBinauralEnabled: (enabled: boolean) => void
  // Paneles (máx. 2 niveles: pantalla principal → panel — Regla dura #4)
  openPanel: (panel: Exclude<PanelId, null>) => void
  closePanel: () => void
}

export type AppStore = AppStoreState & AppStoreActions

export const selectIsFocusMode = (state: AppStore) =>
  state.timer.phase === 'focus' && state.timer.status === 'running'

const initialTimer: TimerState = {
  phase: 'focus',
  status: 'idle',
  phaseEndsAt: null,
  remainingSecondsPaused: null,
  sessionsCompletedInCycle: 0,
}

export const phaseDurationMinutes = (phase: TimerPhase, config: SessionConfig): number => {
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

      startCurrentPhase: () => {
        const { settings, timer } = get()
        const minutes = phaseDurationMinutes(timer.phase, settings.config)
        set({
          timer: {
            ...timer,
            status: 'running',
            phaseEndsAt: Date.now() + minutes * 60_000,
            remainingSecondsPaused: null,
          },
        })
      },

      pauseTimer: () => {
        const { timer } = get()
        if (timer.status !== 'running' || timer.phaseEndsAt === null) return
        const remainingSecondsPaused = Math.max(
          0,
          Math.round((timer.phaseEndsAt - Date.now()) / 1000)
        )
        set({
          timer: {
            ...timer,
            status: 'paused',
            phaseEndsAt: null,
            remainingSecondsPaused,
          },
        })
      },

      resumeTimer: () => {
        const { timer } = get()
        if (timer.status !== 'paused' || timer.remainingSecondsPaused === null) return
        set({
          timer: {
            ...timer,
            status: 'running',
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
            status: 'running',
            phaseEndsAt: Date.now() + nextMinutes * 60_000,
            remainingSecondsPaused: null,
            sessionsCompletedInCycle,
          },
        })
      },

      resetTimer: () => set({ timer: initialTimer }),

      getRemainingSeconds: () => {
        const { timer, settings } = get()
        if (timer.status === 'running' && timer.phaseEndsAt !== null) {
          return Math.max(0, Math.round((timer.phaseEndsAt - Date.now()) / 1000))
        }
        if (timer.status === 'paused' && timer.remainingSecondsPaused !== null) {
          return timer.remainingSecondsPaused
        }
        return phaseDurationMinutes(timer.phase, settings.config) * 60
      },

      cyclePhase: () => {
        const { timer } = get()
        if (timer.status !== 'idle') return
        const phases: TimerPhase[] = ['focus', 'break', 'longBreak']
        const currentIndex = phases.indexOf(timer.phase)
        const nextPhase = phases[(currentIndex + 1) % phases.length]
        set({ timer: { ...timer, phase: nextPhase } })
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
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version < 1 || (persistedState?.timer && !persistedState.timer.status)) {
          const timer = persistedState?.timer || {}
          let status: SessionStatus = 'idle'
          if (timer.phaseEndsAt !== null) {
            status = 'running'
          } else if (timer.remainingSecondsPaused !== null) {
            status = 'paused'
          }
          persistedState.timer = {
            ...timer,
            status,
            isRunning: undefined,
          }
        }
        return persistedState
      },
      // `activePanel` es estado de UI efímero: no se persiste.
      partialize: (state) => ({
        settings: state.settings,
        timer: state.timer,
        history: state.history,
      }),
    }
  )
)
