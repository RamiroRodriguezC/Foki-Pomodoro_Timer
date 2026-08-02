import { create } from 'zustand'
import { AudioService } from '../services/AudioService'
import { getAmbientTrack, MUSIC_LIBRARY } from '../constants/SoundLibrary'
import type { AppSettings, SoundSelection } from '../types'

/**
 * Store efímero de reproducción de audio.
 * NO persiste (a diferencia de useAppStore/useTaskStore) — se resetea en cada carga de la app.
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
}

export type AudioStore = AudioStoreState & AudioStoreActions

export const useAudioStore = create<AudioStore>((set, get) => ({
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
        // Reproducir ambiente en loop
        const track = getAmbientTrack(soundSelection.ambientTrackId || '')
        if (!track) {
          console.error('Ambient track not found:', soundSelection.ambientTrackId)
          return
        }

        await AudioService.playTrack(track.file, { loop: true })
        set({ isPlaying: true, currentTrackId: track.id })
      } else if (soundSelection.category === 'music') {
        // Reproducir música en loop (usar índice actual o arrancar desde 0)
        const genre = soundSelection.musicGenre
        if (!genre) {
          console.error('Music genre is null')
          return
        }

        const tracks = MUSIC_LIBRARY[genre]
        if (!tracks || tracks.length === 0) {
          console.error('No tracks found for genre:', genre)
          return
        }

        const currentIndex = get().currentMusicTrackIndex
        const trackIndex = Math.min(currentIndex, tracks.length - 1)
        const track = tracks[trackIndex]

        await AudioService.playTrack(track.file, { loop: true })
        set({
          isPlaying: true,
          currentTrackId: track.id,
          currentMusicTrackIndex: trackIndex,
        })
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

    const genre = soundSelection.musicGenre
    const tracks = MUSIC_LIBRARY[genre]

    // Solo saltar si hay más de 1 track
    if (!tracks || tracks.length <= 1) {
      return
    }

    try {
      const currentIndex = get().currentMusicTrackIndex
      const nextIndex = (currentIndex + 1) % tracks.length
      const nextTrack = tracks[nextIndex]

      await AudioService.playTrack(nextTrack.file, { loop: true })
      set({
        isPlaying: true,
        currentTrackId: nextTrack.id,
        currentMusicTrackIndex: nextIndex,
      })
    } catch (error) {
      console.error('Failed to skip track:', error)
    }
  },
}))

// Selector: está disabled el botón de play porque la categoría es silence
export const selectIsPlayDisabled = (settings: AppSettings) =>
  settings.soundSelection.category === 'silence'
