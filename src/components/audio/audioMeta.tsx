import React from 'react'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import type { MusicGenre, SoundSelection } from '../../types'
import { getAmbientTrack } from '../../constants/SoundLibrary'

/**
 * Meta de UI para audio: íconos y labels de tracks/géneros.
 * Mapeo aproximado del mockup — si algún nombre de ícono no existe en el set
 * instalado, usar el más parecido (decisión de mapeo, no de producto).
 */

export type IconSetName = 'feather' | 'ionicons' | 'mci'

export interface IconSpec {
  set: IconSetName
  name: string
}

export const ICON_SILENCE: IconSpec = { set: 'feather', name: 'volume-x' }
export const ICON_PLAY: IconSpec = { set: 'feather', name: 'play' }
export const ICON_PAUSE: IconSpec = { set: 'feather', name: 'pause' }
export const ICON_CHEVRON_DOWN: IconSpec = { set: 'feather', name: 'chevron-down' }
export const ICON_CHEVRON_RIGHT: IconSpec = { set: 'feather', name: 'chevron-right' }
export const ICON_SKIP: IconSpec = { set: 'feather', name: 'skip-forward' }
export const ICON_VOLUME: IconSpec = { set: 'feather', name: 'volume-2' }

// Íconos por id de track de AMBIENT_LIBRARY. Los ids futuros (Bosque, Café,
// Olas, Fuego) se agregan acá cuando existan los .mp3 reales:
//   bosque: { set: 'mci', name: 'forest' } | cafe: { set: 'feather', name: 'coffee' }
//   olas: { set: 'mci', name: 'waves' } | fuego: { set: 'ionicons', name: 'flame-outline' }
export const AMBIENT_ICONS: Record<string, IconSpec> = {
  pinkNoise: { set: 'feather', name: 'headphones' },
  rain: { set: 'ionicons', name: 'rainy-outline' },
}

const DEFAULT_AMBIENT_ICON: IconSpec = { set: 'feather', name: 'headphones' }

// Íconos por género de MUSIC_LIBRARY.
export const GENRE_ICONS: Record<MusicGenre, IconSpec> = {
  loFi: { set: 'feather', name: 'coffee' }, // mismo ícono que Café — intencional (mockup)
  classical: { set: 'feather', name: 'music' },
  // piano: { set: 'mci', name: 'piano' } — cuando exista el género
}

// Labels de display de los géneros (los nombres oficiales de tracks se confirman
// con el usuario — ver ⚠️ en SoundLibrary.ts).
export const GENRE_LABELS: Record<MusicGenre, string> = {
  loFi: 'Lo-Fi',
  classical: 'Clásica',
}

/** Renderiza un ícono según su set, con tipado por glyphMap de cada set. */
export function AudioIcon({
  spec,
  size,
  color,
}: {
  spec: IconSpec
  size: number
  color: string
}) {
  const props = { size, color } as const
  switch (spec.set) {
    case 'ionicons':
      return <Ionicons name={spec.name as keyof typeof Ionicons.glyphMap} {...props} />
    case 'mci':
      return (
        <MaterialCommunityIcons
          name={spec.name as keyof typeof MaterialCommunityIcons.glyphMap}
          {...props}
        />
      )
    default:
      return <Feather name={spec.name as keyof typeof Feather.glyphMap} {...props} />
  }
}

/** Resuelve ícono + label de la selección activa (para la AudioPill). */
export function getSelectionMeta(selection: SoundSelection): {
  icon: IconSpec
  label: string
} {
  if (selection.category === 'silence') {
    return { icon: ICON_SILENCE, label: 'Silencio' }
  }
  if (selection.category === 'ambient') {
    const track = getAmbientTrack(selection.ambientTrackId ?? '')
    return {
      icon: AMBIENT_ICONS[track?.id ?? ''] ?? DEFAULT_AMBIENT_ICON,
      label: track?.name ?? 'Ambiente',
    }
  }
  const genre = selection.musicGenre ?? 'loFi'
  return {
    icon: GENRE_ICONS[genre] ?? { set: 'feather', name: 'music' },
    label: GENRE_LABELS[genre] ?? genre,
  }
}
