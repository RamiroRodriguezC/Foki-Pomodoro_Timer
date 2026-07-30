import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { Colors } from '../../constants/Colors'
import { useAppStore } from '../../stores/useAppStore'

// Visible únicamente con la sesión en pausa (Regla dura #6 y ss. no aplica acá,
// pero sí el criterio de "sin elementos que no correspondan al estado actual").
export function ResetButton() {
  const status = useAppStore((state) => state.timer.status)
  const cancelToIdle = useAppStore((state) => state.cancelToIdle)

  if (status !== 'paused') return null

  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)}>
      <Pressable onPress={cancelToIdle} style={styles.pressable} hitSlop={8}>
        <Text style={styles.label}>Reestablecer</Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  pressable: {
    marginTop: 12,
    alignSelf: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: Colors.danger,
  },
})