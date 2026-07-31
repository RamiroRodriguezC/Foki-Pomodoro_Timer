import type { MusicGenre } from '../types'

export interface Track {
  id: string
  name: string
  subtitle?: string   // ej. "285 Hz" bajo "Ruido rosa"
  file: number         // resultado de require()
}

// REGLA DURA de este archivo: tope de 8 tracks por categoría (Ambientes y cada
// género de Música). Si el día de mañana se agrega un 9no, hay que sacar uno
// primero — es decisión de producto, no técnica. No levantar este límite sin
// confirmarlo antes.
export const MAX_TRACKS_PER_CATEGORY = 8

// --- Ambientes: loops sueltos, sin concepto de "playlist" ni "saltar pista" ---
// Orden = orden de aparición en el sheet (de mayor a menor uso típico en foco).
export const AMBIENT_LIBRARY: Track[] = [
  {
    id: 'pinkNoise',
    name: 'Ruido rosa',
    subtitle: '285 Hz',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
    file: require('../../assets/Sounds/SoundBarrier/PinkNoise.mp3'),
  },
  {
    id: 'rain',
    name: 'Lluvia',
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
    file: require('../../assets/Sounds/SoundBarrier/Ambient/rain.mp3'),
  },
  // Bosque, Café, Olas, Fuego: agregar acá cuando exista el .mp3 real.
]

// --- Música: cada género es una mini-playlist. Hoy cada una tiene 1 sola
// pista, pero el shape soporta N pistas (para "Saltar Pista"). ---
export const MUSIC_LIBRARY: Record<MusicGenre, Track[]> = {
  loFi: [
    {
      id: 'lofi-beat-1',
      name: 'Midnight Focus', // ⚠️ nombre de display inventado — confirmar con el usuario
                                // si el track tiene un nombre "oficial" distinto al del archivo.
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
      file: require('../../assets/Sounds/SoundBarrier/Lo-Fi/lofiBeat1.mp3'),
    },
  ],
  classical: [
    {
      id: 'classic-beat',
      name: 'Classic Beat', // ⚠️ mismo caso: nombre inventado, confirmar.
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
      file: require('../../assets/Sounds/SoundBarrier/Classic/classicbeat.mp3'),
    },
  ],
  // piano: [] — no crear la key hasta que existan tracks reales.
}

// eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
export const GONG_START = require('../../assets/Sounds/Gongs/startGong.mp3')
// eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
export const GONG_FINISH = require('../../assets/Sounds/Gongs/finishGong.mp3')

// Helpers de selector — mismo criterio que selectActiveTasks/selectQueuedTasks
// en useTaskStore: la lógica de "qué tracks tiene una categoría" vive acá,
// nunca se recalcula en un componente.
export const getMusicGenres = (): MusicGenre[] =>
  (Object.keys(MUSIC_LIBRARY) as MusicGenre[]).filter((g) => MUSIC_LIBRARY[g].length > 0)

export const getAmbientTrack = (id: string): Track | undefined =>
  AMBIENT_LIBRARY.find((t) => t.id === id)
