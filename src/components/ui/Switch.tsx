import React, { useEffect } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Colors } from '../../constants/Colors'

const WIDTH = 34
const HEIGHT = 19
const PADDING = 2
const BORDER_WIDTH = 1
const KNOB_SIZE = HEIGHT - BORDER_WIDTH * 2 - PADDING * 2 // 13
const KNOB_TRAVEL = WIDTH - BORDER_WIDTH * 2 - PADDING * 2 - KNOB_SIZE // 15
const ANIMATION_MS = 200

// AnimatedPressable es un wrapper de módulo para no recrearlo en cada render.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

/**
 * Toggle custom reutilizable. El Switch nativo varía de estilo entre
 * plataformas; este se ve igual en web/iOS/Android.
 *
 * Internamente usa AnimatedPressable (createAnimatedComponent(Pressable)):
 * Reanimated solo aplica estilos animados sobre componentes Animated.* — un
 * Pressable plano ignora el backgroundColor animado y la pastilla queda
 * transparente.
 */
export function Switch({
  value,
  onChange,
  accessibilityLabel,
}: {
  value: boolean
  onChange: (v: boolean) => void
  accessibilityLabel?: string
}) {
  const progress = useSharedValue(value ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(value ? 1 : 0, { duration: ANIMATION_MS })
  }, [value, progress])

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [Colors.backgroundElevated, Colors.accentOne]
    ),
  }))

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * KNOB_TRAVEL }],
  }))

  return (
    <AnimatedPressable
      style={[styles.toggle, trackStyle]}
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[styles.toggleKnob, knobStyle]} />
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  toggle: {
    width: WIDTH,
    height: HEIGHT,
    borderRadius: HEIGHT / 2,
    borderWidth: BORDER_WIDTH,
    borderColor: Colors.border,
    padding: PADDING,
  },
  toggleKnob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: Colors.textBright,
  },
})