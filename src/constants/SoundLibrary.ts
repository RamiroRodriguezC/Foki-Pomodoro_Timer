import type { MusicGenre } from '../types'

export interface Track {
  id: string
  name: string
  subtitle?: string    // ej. "285 Hz" bajo "Ruido rosa"
  author?: string      // ej. "Noise Foundation" — se muestra como "By {author}"
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
    author: 'Noise Foundation',
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
      id: 'classic-moonlight',
      name: 'Claro de luna',
      subtitle: 'Op. 27 n.º 2 — I. Adagio sostenuto',
      author: 'Beethoven',
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
      file: require('../../assets/Sounds/SoundBarrier/Classic/Paul Pitman - Moonlight Sonata, Op. 27 No. 2 - I. Adagio sostenuto.mp3'),
    },
    {
      id: 'classic-goldberg-aria',
      name: 'Variaciones Goldberg — Aria',
      subtitle: 'BWV 988',
      author: 'Bach',
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
      file: require('../../assets/Sounds/SoundBarrier/Classic/Goldberg Variations, BWV 988 - Aria.mp3'),
    },
    {
      id: 'classic-nocturne-op9',
      name: 'Nocturno Op. 9 n.º 2',
      subtitle: 'Mi bemol mayor',
      author: 'Chopin',
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
      file: require('../../assets/Sounds/SoundBarrier/Classic/Nocturne in E flat major, Op. 9 no. 2.mp3'),
    },
    {
      id: 'classic-gymnopedie-1',
      name: 'Gymnopédie n.º 1',
      author: 'Satie',
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
      file: require('../../assets/Sounds/SoundBarrier/Classic/Gymnopédie no. 1.mp3'),
    },
    {
      id: 'classic-italian-concerto',
      name: 'Concierto italiano',
      subtitle: 'BWV 971 — II. Andante',
      author: 'Bach',
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
      file: require('../../assets/Sounds/SoundBarrier/Classic/Italian Concerto, BWV. 971 - 2. Andante [piano].mp3'),
    },
  ],
  // piano: [] — no crear la key hasta que existan tracks reales.
}

// eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
export const GONG_START = require('../../assets/Sounds/Gongs/startGong.mp3')
// eslint-disable-next-line @typescript-eslint/no-require-imports -- assets estáticos de Expo se importan con require()
export const GONG_FINISH = require('../../assets/Sounds/Gongs/finishGong.mp3')

// Helpers de selector — mismo criterio que selectActiveTasks/selectAllTasks
// en useTaskStore: la lógica de "qué tracks tiene una categoría" vive acá,
// nunca se recalcula en un componente.
export const getMusicGenres = (): MusicGenre[] =>
  (Object.keys(MUSIC_LIBRARY) as MusicGenre[]).filter((g) => MUSIC_LIBRARY[g].length > 0)

export const getAmbientTrack = (id: string): Track | undefined =>
  AMBIENT_LIBRARY.find((t) => t.id === id)
