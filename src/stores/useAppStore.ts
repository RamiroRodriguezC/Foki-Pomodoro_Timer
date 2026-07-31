import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { storage } from '../services/storage'
import { AudioService } from '../services/AudioService'
import { useAudioStore } from './useAudioStore'
import { GONG_START, GONG_FINISH } from '../constants/SoundLibrary'
import {
  AppSettings,
  DEFAULT_SETTINGS,
  MusicGenre,
  PanelId,
  SessionConfig,
  SessionRecord,
  SessionStatus,
  SoundSelection,
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
  cancelToIdle: () => void
  getRemainingSeconds: () => number
  cyclePhase: () => void
  // Settings
  updateSessionConfig: (partial: Partial<SessionConfig>) => void
  selectAmbientTrack: (trackId: string) => void
  selectMusicGenre: (genre: MusicGenre) => void
  selectSilence: () => void
  setVolume: (volume: number) => void
  setAutoSyncEnabled: (enabled: boolean) => void
  setBinauralEnabled: (enabled: boolean) => void
  // Paneles (máx. 2 niveles: pantalla principal → panel — Regla dura #4)
  openPanel: (panel: Exclude<PanelId, null>) => void
  closePanel: () => void
}

export type AppStore = AppStoreState & AppStoreActions

// Shape persistido de versiones anteriores (para migrate()). Los campos
// opcionales reflejan lo que podía existir antes de la versión 2.
interface PersistedStateV1 {
  settings?: {
    config?: SessionConfig
    soundBarrier?: string
    binauralEnabled?: boolean
    volume?: number
    autoSyncEnabled?: boolean
    soundSelection?: SoundSelection
  }
  timer?: Partial<TimerState> & { isRunning?: boolean }
  history?: SessionRecord[]
}

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

        // Audio hooks (Fase 3)
        // Gong de inicio solo en focus
        if (timer.phase === 'focus') {
          AudioService.playOneShot(GONG_START)
        }

        // Auto-sync: reproducir selección actual con fade-in si está habilitado
        if (
          settings.autoSyncEnabled &&
          settings.soundSelection.category !== 'silence' &&
          timer.phase === 'focus' // Solo auto-play en focus, nunca en break/longBreak
        ) {
          // Iniciar reproducción y hacer fade-in
          useAudioStore.getState().playSelection().then(() => {
            AudioService.fadeTo(settings.volume, 1500)
          })
        }
      },

      pauseTimer: () => {
        const { timer, settings } = get()
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

        // Audio hooks (Fase 3)
        // Fade-out rápido en pausa manual (1s), pero NO cambiar la selección
        // Al resumir, el mismo track vuelve a subir
        // Solo si auto-sync está ON — si el usuario puso audio manual con auto-sync OFF,
        // no debe cortarse por pausar el timer
        const audioState = useAudioStore.getState()
        if (settings.autoSyncEnabled && audioState.isPlaying) {
          AudioService.fadeTo(0, 1000)
        }
      },

      resumeTimer: () => {
        const { timer, settings } = get()
        if (timer.status !== 'paused' || timer.remainingSecondsPaused === null) return
        set({
          timer: {
            ...timer,
            status: 'running',
            phaseEndsAt: Date.now() + timer.remainingSecondsPaused * 1000,
            remainingSecondsPaused: null,
          },
        })

        // Audio hooks (Fase 3)
        // Fade-in al volumen configurado si auto-sync está ON y no es silence
        // Solo en fase focus (en break/longBreak el silencio es total)
        if (
          timer.phase === 'focus' &&
          settings.autoSyncEnabled &&
          settings.soundSelection.category !== 'silence'
        ) {
          AudioService.fadeTo(settings.volume, 1500)
        }
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

        // Audio hooks (Fase 3)
        // Siempre sonar el cuenco/gong de fin en TODA transición de fase
        AudioService.playOneShot(GONG_FINISH)

        // Determinar comportamiento según la fase que EMPIEZA (upcomingPhase)
        if (upcomingPhase === 'break' || upcomingPhase === 'longBreak') {
          // Silencio total durante descansos (decisión de diseño fija, no depende de autoSyncEnabled)
          AudioService.fadeTo(0, 1500).then(() => {
            AudioService.stop()
          })
        } else if (upcomingPhase === 'focus') {
          // Volver a focus: auto-sync si está habilitado
          if (
            settings.autoSyncEnabled &&
            settings.soundSelection.category !== 'silence'
          ) {
            // Si ya hay algo cargado (venimos de un break), solo hacer fade-in
            // Si no, cargar la selección primero
            const audioState = useAudioStore.getState()
            if (audioState.currentTrackId) {
              // Ya hay un track cargado, solo resumir y fade-in
              AudioService.resume()
              AudioService.fadeTo(settings.volume, 1500)
            } else {
              // No hay track cargado, cargar primero
              audioState.playSelection().then(() => {
                AudioService.fadeTo(settings.volume, 1500)
              })
            }
          }
        }
      },

      resetTimer: () => set({ timer: initialTimer }),

      // Cancela la sesión en curso sin tocar la fase ni el conteo del ciclo —
      // vuelve a 'idle' en la MISMA fase en la que estaba pausado. Distinto de
      // resetTimer(), que hace un reset duro a focus/idle y borra sessionsCompletedInCycle.
      cancelToIdle: () => {
        const { timer } = get()
        if (timer.status !== 'paused') return
        set({
          timer: {
            ...timer,
            status: 'idle',
            phaseEndsAt: null,
            remainingSecondsPaused: null,
          },
        })

        // Audio hooks (Fase 3)
        // Asegurar que no quede audio sonando de fondo al cancelar
        AudioService.stop()
      },

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

      selectAmbientTrack: (trackId) => {
        set((state) => ({
          settings: {
            ...state.settings,
            soundSelection: {
              category: 'ambient',
              ambientTrackId: trackId,
              musicGenre: null,
            },
          },
        }))
      },

      selectMusicGenre: (genre) => {
        set((state) => ({
          settings: {
            ...state.settings,
            soundSelection: {
              category: 'music',
              ambientTrackId: null,
              musicGenre: genre,
            },
          },
        }))
      },

      selectSilence: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            soundSelection: {
              category: 'silence',
              ambientTrackId: null,
              musicGenre: null,
            },
          },
        }))
      },

      setVolume: (volume) => {
        set((state) => ({
          settings: { ...state.settings, volume: Math.max(0, Math.min(1, volume)) },
        }))
      },

      setAutoSyncEnabled: (enabled) => {
        set((state) => ({ settings: { ...state.settings, autoSyncEnabled: enabled } }))
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
      version: 2,
      // Shape viejo persistido (versiones 0 y 1): shape v1 (soundBarrier) y v0 (timer sin status).
      // El resto de campos se valida contra los defaults al leer.
      migrate: (persistedState: unknown, version: number) => {
        const persisted = persistedState as PersistedStateV1 | undefined
        if (!persisted) return persistedState

        // Migración de version < 1: agregar campo `status` al timer
        if (version < 1 || (persisted.timer && !persisted.timer.status)) {
          const timer: Partial<TimerState> & { isRunning?: boolean } = persisted.timer ?? {}
          let status: SessionStatus = 'idle'
          if (timer.phaseEndsAt !== null) {
            status = 'running'
          } else if (timer.remainingSecondsPaused !== null) {
            status = 'paused'
          }
          persisted.timer = {
            ...timer,
            status,
            isRunning: undefined,
          }
        }

        // Migración de version < 2: migrar shape viejo de soundBarrier al nuevo soundSelection
        if (version < 2 && persisted.settings) {
          const settings = persisted.settings

          // Si existe el campo viejo soundBarrier, mapearlo al nuevo
          if (settings.soundBarrier !== undefined) {
            const oldBarrier = settings.soundBarrier

            // Mapear cada valor viejo al nuevo shape
            switch (oldBarrier) {
              case 'none':
                settings.soundSelection = {
                  category: 'silence',
                  ambientTrackId: null,
                  musicGenre: null,
                }
                break
              case 'pinkNoise':
                settings.soundSelection = {
                  category: 'ambient',
                  ambientTrackId: 'pinkNoise',
                  musicGenre: null,
                }
                break
              case 'ambient':
                // Era el único ambiente real (lluvia)
                settings.soundSelection = {
                  category: 'ambient',
                  ambientTrackId: 'rain',
                  musicGenre: null,
                }
                break
              case 'classic':
                settings.soundSelection = {
                  category: 'music',
                  ambientTrackId: null,
                  musicGenre: 'classical',
                }
                break
              case 'loFi':
                settings.soundSelection = {
                  category: 'music',
                  ambientTrackId: null,
                  musicGenre: 'loFi',
                }
                break
              default:
                // Fallback a silence si no reconocemos el valor
                settings.soundSelection = {
                  category: 'silence',
                  ambientTrackId: null,
                  musicGenre: null,
                }
            }

            // Borrar el campo viejo
            delete settings.soundBarrier
          }

          // Agregar campos nuevos si no existen
          if (settings.volume === undefined) {
            settings.volume = 0.6
          }
          if (settings.autoSyncEnabled === undefined) {
            settings.autoSyncEnabled = true
          }
          // binauralEnabled ya existía, no tocarlo
        }

        return persisted
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
