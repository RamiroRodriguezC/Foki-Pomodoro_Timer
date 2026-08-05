import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Colors } from '../../constants/Colors'
import { AudioIcon, ICON_CHEVRON_DOWN, ICON_CHEVRON_UP } from '../audio/audioMeta'
import { useFocusFade } from '../layout/useFocusFade'
import type { TimerPhase } from '../../types'

interface PomodoroLabelProps {
  phase: TimerPhase
  isIdle: boolean
  onPress: () => void
}

const PHASE_LABELS: Record<TimerPhase, string> = {
  focus: 'Focus',
  break: 'Break',
  longBreak: 'Long Break',
}

const CHEVRON_SIZE = 10
const LABEL_LINE_HEIGHT = 18
const CAROUSEL_DURATION = 450

// Opacidad del label durante Focus Mode: "un poco más translúcido"
// (AGENTS 4.5) — no desaparece del todo, solo baja de intensidad.
const FOCUS_LABEL_OPACITY = 0.4

// AnimatedPressable es un wrapper de módulo para no recrearlo en cada render.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function PomodoroLabel({ phase, isIdle, onPress }: PomodoroLabelProps) {
  const label = PHASE_LABELS[phase]
  const [settled, setSettled] = useState(label)
  const translate = useSharedValue(0)
  const fade = useFocusFade(FOCUS_LABEL_OPACITY)

  useEffect(() => {
    if (label === settled) return
    translate.value = -LABEL_LINE_HEIGHT
    translate.value = withTiming(0, { duration: CAROUSEL_DURATION }, (finished) => {
      if (finished) runOnJS(setSettled)(label)
    })
  }, [label, settled, translate])

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }],
  }))

  return (
    <AnimatedPressable
      onPress={isIdle ? onPress : undefined}
      disabled={!isIdle}
      style={[styles.pressable, fade.style]}
    >
      <View style={styles.row}>
        {/* Indicador de "presionable": solo se renderiza cuando el label se
            puede tocar (idle). Flota absoluto a la izquierda del label — no
            participa del flujo del row, así el label queda SIEMPRE centrado
            sobre el eje del dial y del tiempo, con chevrons o sin ellos. */}
        {isIdle ? (
          <View style={styles.chevrons}>
            <AudioIcon spec={ICON_CHEVRON_UP} size={CHEVRON_SIZE} color={Colors.textMuted} />
            <AudioIcon spec={ICON_CHEVRON_DOWN} size={CHEVRON_SIZE} color={Colors.textMuted} />
          </View>
        ) : null}

        {/* Carrusel vertical: al cambiar de fase, la línea nueva baja desde arriba
            mientras la actual baja y sale por debajo, dentro de un clip de altura fija. */}
        <View style={styles.clip}>
          <Animated.View style={[styles.track, trackStyle]}>
            <View style={styles.slot}>
              <Text style={styles.phaseLabel}>{label}</Text>
            </View>
            <View style={styles.slot}>
              <Text style={styles.phaseLabel}>{settled}</Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  // Chevrons absolutos: right: '100%' los pega al borde izquierdo del label;
  // el marginRight reproduce el gap que tenían cuando estaban en el flujo.
  chevrons: {
    position: 'absolute',
    right: '100%',
    marginRight: 4,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  clip: {
    height: LABEL_LINE_HEIGHT,
    overflow: 'hidden',
  },
  track: {
    height: LABEL_LINE_HEIGHT * 2,
  },
  slot: {
    height: LABEL_LINE_HEIGHT,
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: LABEL_LINE_HEIGHT,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
  },
})