import React, { useEffect } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Colors } from '../../constants/Colors'
import { useAppStore } from '../../stores/useAppStore'

const FADE_DURATION = 200

// Flota ABSOLUTO a la derecha del mm:ss (mismo patrón que los chevrons del
// PomodoroLabel, pero al revés: `left: '100%'` lo pega al borde derecho del
// display). No participa del flujo: el Timer no cambia de alto al pausar/
// reanudar, el dial queda centrado siempre, y solo se anima opacidad —
// nunca el layout. Visible únicamente con la sesión en pausa.
export function ResetButton() {
  const status = useAppStore((state) => state.timer.status)
  const cancelToIdle = useAppStore((state) => state.cancelToIdle)
  const isPaused = status === 'paused'

  const opacity = useSharedValue(isPaused ? 1 : 0)

  useEffect(() => {
    opacity.value = withTiming(isPaused ? 1 : 0, { duration: FADE_DURATION })
  }, [isPaused, opacity])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return (
    <Animated.View
      style={[styles.floater, animatedStyle]}
      pointerEvents={isPaused ? 'auto' : 'none'}
    >
      <Pressable onPress={cancelToIdle} hitSlop={8}>
        <Text style={styles.label}>Reestablecer</Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  floater: {
    position: 'absolute',
    left: '100%',
    marginLeft: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.danger,
  },
})
