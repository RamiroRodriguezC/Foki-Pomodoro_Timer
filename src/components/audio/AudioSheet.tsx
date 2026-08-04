import React, { useCallback, useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Slider from '@react-native-community/slider'
import { Colors } from '../../constants/Colors'
import { AMBIENT_LIBRARY, getMusicGenres, MUSIC_LIBRARY } from '../../constants/SoundLibrary'
import { useAppStore } from '../../stores/useAppStore'
import { useAudioStore } from '../../stores/useAudioStore'
import { AudioService } from '../../services/AudioService'
import { InfoButton } from '../ui/InfoButton'
import { Switch } from '../ui/Switch'
import type { MusicGenre } from '../../types'
import {
  AMBIENT_ICONS,
  AudioIcon,
  GENRE_ICONS,
  GENRE_LABELS,
  ICON_CHEVRON_RIGHT,
  ICON_SILENCE,
  ICON_SKIP,
  ICON_VOLUME,
} from './audioMeta'

// Altura máxima fija de la lista (≈ 4 filas visibles según mockup). El scroll
// interno maneja cualquier cantidad de tracks — nunca depende de .length.
const LIST_MAX_HEIGHT = 118
const FADE_HEIGHT = 18

type Tab = 'ambient' | 'music'

export function AudioSheet() {
  const settings = useAppStore((state) => state.settings)
  const selectAmbientTrack = useAppStore((state) => state.selectAmbientTrack)
  const selectMusicGenre = useAppStore((state) => state.selectMusicGenre)
  const selectSilence = useAppStore((state) => state.selectSilence)
  const setAutoSyncEnabled = useAppStore((state) => state.setAutoSyncEnabled)

  const isPlaying = useAudioStore((state) => state.isPlaying)
  const currentTrackId = useAudioStore((state) => state.currentTrackId)
  const playSelection = useAudioStore((state) => state.playSelection)
  const pausePlayback = useAudioStore((state) => state.pausePlayback)
  const skipMusicTrack = useAudioStore((state) => state.skipMusicTrack)

  const { soundSelection } = settings

  // Pestaña inicial según la categoría activa; se re-sincroniza cuando la
  // categoría cambia (el sheet siempre refleja dónde está parada la selección).
  const [activeTab, setActiveTab] = useState<Tab>(
    soundSelection.category === 'music' ? 'music' : 'ambient'
  )

  useEffect(() => {
    setActiveTab(soundSelection.category === 'music' ? 'music' : 'ambient')
  }, [soundSelection.category])

  // Detección de contenido oculto para mostrar el degradé de scroll
  const [ambientOverflow, setAmbientOverflow] = useState(false)
  const [musicOverflow, setMusicOverflow] = useState(false)

  const genres = getMusicGenres()
  const activeGenre =
    soundSelection.category === 'music' ? soundSelection.musicGenre : null
  const isSilenceActive = soundSelection.category === 'silence'

  const handleSilencePress = useCallback(() => {
    selectSilence()
    if (isPlaying) {
      pausePlayback()
    }
  }, [isPlaying, pausePlayback, selectSilence])

  const handleAmbientPress = useCallback(
    (trackId: string) => {
      selectAmbientTrack(trackId)
      // Releer la selección recién actualizada (zustand set es síncrono) para
      // reproducir el track recién elegido, no el capturado en el closure.
      playSelection(useAppStore.getState().settings.soundSelection)
    },
    [playSelection, selectAmbientTrack]
  )

  const handleGenrePress = useCallback(
    (genre: MusicGenre) => {
      selectMusicGenre(genre)
      playSelection(useAppStore.getState().settings.soundSelection)
    },
    [playSelection, selectMusicGenre]
  )

  // Volumen: aplicar en vivo mientras se arrastra (sin fade); persistir al soltar.
  const handleVolumeChange = useCallback((value: number) => {
    AudioService.setVolume(value)
  }, [])

  const handleVolumeComplete = useCallback((value: number) => {
    useAppStore.getState().setVolume(value)
  }, [])

  const renderAmbientList = () => (
    <View style={styles.listWrapper}>
      <ScrollView
        style={styles.list}
        onContentSizeChange={(_w, h) => setAmbientOverflow(h > LIST_MAX_HEIGHT)}
      >
        {AMBIENT_LIBRARY.map((track) => {
          const isActive =
            soundSelection.category === 'ambient' &&
            soundSelection.ambientTrackId === track.id
          return (
            <Pressable
              key={track.id}
              style={styles.ambientRow}
              onPress={() => handleAmbientPress(track.id)}
              accessibilityRole="button"
            >
              <View style={styles.ambientMainRow}>
                <AudioIcon
                  spec={AMBIENT_ICONS[track.id] ?? { set: 'feather', name: 'headphones' }}
                  size={16}
                  color={isActive ? Colors.accentGreen : Colors.textPrimary}
                />
                <View style={styles.trackNameRow}>
                  <Text style={[styles.trackName, isActive && styles.trackNameActive]}>
                    {track.name}
                  </Text>
                  {track.subtitle ? (
                    <Text style={styles.trackSubtitle}>{track.subtitle}</Text>
                  ) : null}
                </View>
              </View>
              {track.author ? (
                <Text style={styles.authorLine}>By {track.author}</Text>
              ) : null}
            </Pressable>
          )
        })}
      </ScrollView>
      {ambientOverflow && (
        <LinearGradient
          colors={['rgba(27, 24, 48, 0)', Colors.surface]}
          style={styles.fade}
          pointerEvents="none"
        />
      )}
    </View>
  )

  const renderMusicList = () => (
    <View style={styles.listWrapper}>
      <ScrollView
        style={styles.list}
        onContentSizeChange={(_w, h) => setMusicOverflow(h > LIST_MAX_HEIGHT)}
      >
        {genres.map((genre) => {
          const isActive = activeGenre === genre
          const tracks = MUSIC_LIBRARY[genre] ?? []
          const activeTrack =
            tracks.find((t) => t.id === currentTrackId) ?? tracks[0]

          return (
            <View key={genre} style={styles.trackRow}>
              <Pressable
                style={styles.genreMain}
                onPress={() => handleGenrePress(genre)}
                accessibilityRole="button"
              >
                <View style={styles.genreLine}>
                  <View style={styles.genreLeft}>
                    <AudioIcon
                      spec={GENRE_ICONS[genre] ?? { set: 'feather', name: 'music' }}
                      size={16}
                      color={isActive ? Colors.accentGreen : Colors.textPrimary}
                    />
                    <Text style={[styles.genreName, isActive && styles.genreNameActive]}>
                      {GENRE_LABELS[genre] ?? genre}
                    </Text>
                  </View>
                </View>
                {isActive && activeTrack ? (
                  <Text style={styles.trackSub} numberOfLines={1}>
                    {activeTrack.name}
                  </Text>
                ) : null}
              </Pressable>
              {isActive && (
                <Pressable
                  style={styles.skipBtn}
                  onPress={() =>
                    skipMusicTrack(useAppStore.getState().settings.soundSelection)
                  }
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Saltar pista"
                >
                  <AudioIcon spec={ICON_SKIP} size={14} color={Colors.accentCyan} />
                  <Text style={styles.skipText}>Saltar</Text>
                </Pressable>
              )}
            </View>
          )
        })}
      </ScrollView>
      {musicOverflow && (
        <LinearGradient
          colors={['rgba(27, 24, 48, 0)', Colors.surface]}
          style={styles.fade}
          pointerEvents="none"
        />
      )}
    </View>
  )

  return (
    <View>
      {/* Fila fija Silencio (siempre visible, sin importar la pestaña) */}
      <Pressable
        style={styles.silenceRow}
        onPress={handleSilencePress}
        accessibilityRole="button"
        accessibilityLabel="Silencio"
      >
        <View style={styles.silenceLeft}>
          <AudioIcon
            spec={ICON_SILENCE}
            size={16}
            color={isSilenceActive ? Colors.accentGreen : Colors.textPrimary}
          />
          <Text style={[styles.silenceText, isSilenceActive && styles.silenceTextActive]}>
            Silencio
          </Text>
        </View>
        <AudioIcon spec={ICON_CHEVRON_RIGHT} size={14} color={Colors.textMuted} />
      </Pressable>

      {/* Segmented control */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, activeTab === 'ambient' && styles.tabActive]}
          onPress={() => setActiveTab('ambient')}
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, activeTab === 'ambient' && styles.tabTextActive]}>
            Ambientes
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'music' && styles.tabActive]}
          onPress={() => setActiveTab('music')}
          accessibilityRole="button"
        >
          <Text style={[styles.tabText, activeTab === 'music' && styles.tabTextActive]}>
            Música
          </Text>
        </Pressable>
      </View>

      {/* Lista de tracks */}
      {activeTab === 'ambient' ? renderAmbientList() : renderMusicList()}

      {/* Footer: volumen + reproducción inteligente */}
      <View style={styles.footer}>
        <View style={styles.volumeRow}>
          <AudioIcon spec={ICON_VOLUME} size={15} color={Colors.textSecondary} />
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={settings.volume}
            minimumTrackTintColor={Colors.gradientStart}
            maximumTrackTintColor={Colors.border}
            thumbTintColor={Colors.textBright}
            onValueChange={handleVolumeChange}
            onSlidingComplete={handleVolumeComplete}
            accessibilityLabel="Volumen"
          />
        </View>
        <View style={styles.syncRow}>
          <View style={styles.syncLabelRow}>
            <Text style={styles.syncText}>Reproducción inteligente</Text>
            <InfoButton
              text="Reproduce automáticamente el sonido seleccionado durante la fase de concentración y lo pausa durante los intervalos. (¡Tu cerebro también necesita silencio!)"
            />
          </View>
          <Switch
            value={settings.autoSyncEnabled}
            onChange={setAutoSyncEnabled}
            accessibilityLabel="Reproducción inteligente"
          />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  /* --- Fila Silencio --- */
  silenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  silenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  silenceText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  silenceTextActive: {
    color: Colors.accentGreen,
    fontWeight: '500',
  },

  /* --- Segmented control --- */
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 3,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.surfaceLight,
  },
  tabText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.textBright,
    fontWeight: '600',
  },

  /* --- Lista --- */
  listWrapper: {
    position: 'relative',
  },
  list: {
    maxHeight: LIST_MAX_HEIGHT,
  },
  fade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: FADE_HEIGHT,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  genreMain: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  ambientRow: {
    paddingVertical: 7,
    paddingHorizontal: 4,
  },
  ambientMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  trackNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trackName: {
    fontSize: 13.5,
    color: Colors.textPrimary,
  },
  trackNameActive: {
    color: Colors.accentGreen,
    fontWeight: '500',
  },
  trackSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  genreLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  genreName: {
    fontSize: 13.5,
    color: Colors.textPrimary,
  },
  genreNameActive: {
    color: Colors.accentGreen,
    fontWeight: '500',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  skipText: {
    fontSize: 12,
    color: Colors.accentCyan,
  },
  trackSub: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginLeft: 26, // alinea con el texto, no con el ícono
    marginTop: 2,
  },
  authorLine: {
    fontSize: 11.5,
    color: Colors.textSecondary,
    marginLeft: 26, // alinea con el texto, no con el ícono
    marginTop: 2,
  },

  /* --- Footer --- */
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    marginTop: 6,
    paddingTop: 10,
  },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  slider: {
    flex: 1,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  syncLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncText: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
})
