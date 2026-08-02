import React, { useCallback, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Colors } from '../../constants/Colors'
import { useAppStore } from '../../stores/useAppStore'
import { useAudioStore, selectIsPlayDisabled } from '../../stores/useAudioStore'
import {
  AudioIcon,
  getSelectionMeta,
  ICON_CHEVRON_DOWN,
  ICON_PAUSE,
  ICON_PLAY,
} from './audioMeta'

const PILL_INACTIVE_OPACITY = 0.55
const ANIMATION_DURATION = 250

/**
 * Píldora de audio en la esquina superior.
 * Zona izquierda: selección activa (ícono + nombre + ▾) → abre el sheet.
 * Zona derecha: play/pause → reproduce/pausa sin abrir el sheet.
 */
export function AudioPill() {
  const settings = useAppStore((state) => state.settings)
  const openPanel = useAppStore((state) => state.openPanel)
  const isPlaying = useAudioStore((state) => state.isPlaying)
  const playSelection = useAudioStore((state) => state.playSelection)
  const pausePlayback = useAudioStore((state) => state.pausePlayback)

  const isPlayDisabled = selectIsPlayDisabled(settings)
  const { icon, label } = getSelectionMeta(settings.soundSelection)

  // Estado "inactivo/pausado": pill atenuada; al reproducir, opacidad 1.
  const opacity = useSharedValue(PILL_INACTIVE_OPACITY)

  useEffect(() => {
    opacity.value = withTiming(isPlaying ? 1 : PILL_INACTIVE_OPACITY, {
      duration: ANIMATION_DURATION,
    })
  }, [isPlaying, opacity])

  const pillStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  const handlePlayPause = useCallback(() => {
    if (isPlayDisabled) return
    if (isPlaying) {
      pausePlayback()
    } else {
      playSelection(settings.soundSelection)
    }
  }, [isPlayDisabled, isPlaying, pausePlayback, playSelection, settings])

  return (
    <Animated.View style={[styles.pill, pillStyle]}>
      <Pressable
        style={styles.leftZone}
        onPress={() => openPanel('sound')}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Abrir selector de sonido"
      >
        <AudioIcon spec={icon} size={14} color={Colors.textPrimary} />
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <AudioIcon spec={ICON_CHEVRON_DOWN} size={13} color={Colors.textSecondary} />
      </Pressable>

      <View style={styles.divider} />

      <Pressable
        style={[styles.playZone, isPlayDisabled && styles.playZoneDisabled]}
        onPress={handlePlayPause}
        disabled={isPlayDisabled}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={isPlaying ? 'Pausar sonido' : 'Reproducir sonido'}
      >
        <AudioIcon
          spec={isPlaying ? ICON_PAUSE : ICON_PLAY}
          size={14}
          color={Colors.textPrimary}
        />
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  leftZone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingLeft: 14,
    paddingRight: 10,
    maxWidth: 200,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: Colors.border,
  },
  playZone: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  playZoneDisabled: {
    opacity: 0.3,
  },
})
