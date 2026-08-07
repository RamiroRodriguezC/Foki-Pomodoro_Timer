import { create } from 'zustand'
import { AudioService } from '../services/AudioService'
import { getAmbientTrack, MUSIC_LIBRARY } from '../constants/SoundLibrary'
import { useAppStore } from './useAppStore'
import type { AppSettings, SoundSelection } from '../types'

/**
 * Store efímero de reproducción de audio.
 * NO persiste (a diferencia de useAppStore/useTaskStore) — se resetea en cada carga de la app.
 *
 * Excepción a lo anterior: el estado "loopeable" (musicLoopEnabled) se lee desde
 * AppSettings persistido (useAppStore) — ver regla de decisiones en types/index.ts.
 */
interface AudioStoreState {
  isPlaying: boolean
  currentTrackId: string | null // id resuelto (de AMBIENT_LIBRARY o del track actual dentro del género de música)
  currentMusicTrackIndex: number // índice del track actual dentro del género de música (para "Saltar Pista")
}

interface AudioStoreActions {
  playSelection: (soundSelection: SoundSelection) => Promise<void> // resuelve la selección pasada y reproduce
  pausePlayback: () => Promise<void>
  skipMusicTrack: (soundSelection: SoundSelection) => Promise<void> // solo tiene efecto real si category === 'music' y el género tiene >1 track
  advanceToNextMusicTrack: () => Promise<void> // auto-avance al terminar una pista (sin loop)
  stopPlayback: () => Promise<void> // stop + limpieza de track actual (usado al cortar el audio en breaks)
  applyMusicLoop: (enabled: boolean) => void // aplica el modo loop en vivo al player actual
}

export type AudioStore = AudioStoreState & AudioStoreActions

// Un género con 1 sola pista no puede "avanzar": siempre loopea, sin importar
// el toggle. Mismo criterio vive acá y en applyMusicLoop — no en componentes.
const effectiveLoop = (enabled: boolean, trackCount: number) =>
  enabled || trackCount <= 1

export const useAudioStore = create<AudioStore>((set, get) => {
  /**
   * Reproduce el track del índice dado dentro del género de la selección,
   * respetando el toggle de loop persistido (regla dura #8 del AGENTS: la
   * lógica de reproducción vive en el store, no en componentes).
   */
  const playMusicTrack = async (
    soundSelection: SoundSelection,
    trackIndex: number
  ) => {
    const genre = soundSelection.musicGenre
    if (!genre) return

    const tracks = MUSIC_LIBRARY[genre]
    if (!tracks || tracks.length === 0) return

    const safeIndex = Math.min(Math.max(trackIndex, 0), tracks.length - 1)
    const track = tracks[safeIndex]
    const willLoop = effectiveLoop(
      useAppStore.getState().settings.musicLoopEnabled,
      tracks.length
    )

    await AudioService.playTrack(track.file, {
      loop: willLoop,
      onFinish: willLoop ? undefined : () => get().advanceToNextMusicTrack(),
    })
    set({
      isPlaying: true,
      currentTrackId: track.id,
      currentMusicTrackIndex: safeIndex,
    })
  }

  return {
    isPlaying: false,
    currentTrackId: null,
    currentMusicTrackIndex: 0,

    playSelection: async (soundSelection: SoundSelection) => {
      // Defender el caso 'silence' aunque el botón esté disabled en UI
      if (soundSelection.category === 'silence') {
        await AudioService.stop()
        set({ isPlaying: false, currentTrackId: null })
        return
      }

      try {
        if (soundSelection.category === 'ambient') {
          // Reproducir ambiente en loop (los ambientes SIEMPRE loopean)
          const track = getAmbientTrack(soundSelection.ambientTrackId || '')
          if (!track) {
            console.error('Ambient track not found:', soundSelection.ambientTrackId)
            return
          }

          await AudioService.playTrack(track.file, { loop: true })
          set({ isPlaying: true, currentTrackId: track.id })
        } else if (soundSelection.category === 'music') {
          // Reproducir música (usar índice actual o arrancar desde 0)
          await playMusicTrack(soundSelection, get().currentMusicTrackIndex)
        }
      } catch (error) {
        console.error('Failed to play selection:', error)
        set({ isPlaying: false })
      }
    },

    pausePlayback: async () => {
      try {
        await AudioService.pause()
        set({ isPlaying: false })
      } catch (error) {
        console.error('Failed to pause playback:', error)
      }
    },

    skipMusicTrack: async (soundSelection: SoundSelection) => {
      // Solo tiene efecto si category === 'music'
      if (soundSelection.category !== 'music' || !soundSelection.musicGenre) {
        return
      }

      const tracks = MUSIC_LIBRARY[soundSelection.musicGenre]

      // Solo saltar si hay más de 1 track
      if (!tracks || tracks.length <= 1) {
        return
      }

      try {
        const currentIndex = get().currentMusicTrackIndex
        const nextIndex = (currentIndex + 1) % tracks.length
        await playMusicTrack(soundSelection, nextIndex)
      } catch (error) {
        console.error('Failed to skip track:', error)
      }
    },

    advanceToNextMusicTrack: async () => {
      // El auto-avance solo aplica a la música que el usuario está escuchando
      const soundSelection = useAppStore.getState().settings.soundSelection
      if (soundSelection.category !== 'music' || !soundSelection.musicGenre) {
        return
      }

      const tracks = MUSIC_LIBRARY[soundSelection.musicGenre]
      if (!tracks || tracks.length === 0) return

      try {
        const currentIndex = get().currentMusicTrackIndex
        // Género de 1 pista: reproducir la misma (equivalente a reiniciar);
        // con >1 pista, wrap-around infinito.
        const nextIndex =
          tracks.length > 1 ? (currentIndex + 1) % tracks.length : currentIndex
        await playMusicTrack(soundSelection, nextIndex)
      } catch (error) {
        console.error('Failed to advance track:', error)
      }
    },

    stopPlayback: async () => {
      try {
        await AudioService.stop()
        set({ isPlaying: false, currentTrackId: null })
      } catch (error) {
        console.error('Failed to stop playback:', error)
      }
    },

    applyMusicLoop: (enabled: boolean) => {
      const soundSelection = useAppStore.getState().settings.soundSelection
      if (soundSelection.category !== 'music' || !soundSelection.musicGenre) {
        return
      }
      const tracks = MUSIC_LIBRARY[soundSelection.musicGenre]
      AudioService.setLoop(effectiveLoop(enabled, tracks?.length ?? 0))
    },
  }
})

// Selector: está disabled el botón de play porque la categoría es silence
export const selectIsPlayDisabled = (settings: AppSettings) =>
  settings.soundSelection.category === 'silence'
