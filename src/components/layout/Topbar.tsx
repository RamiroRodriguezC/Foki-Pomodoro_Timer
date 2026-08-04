import React from 'react'
import { StyleSheet, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AudioPill } from '../audio/AudioPill'
import { SettingsButton } from '../settings/SettingsButton'
import { TaskButton } from '../tasks/TaskButton'
import { useFocusFade } from './useFocusFade'

export function Topbar() {
  const insets = useSafeAreaInsets()
  // En Focus Mode la barra completa (gestor de tareas, pill de música y
  // botón de configuración) desaparece y no responde a toques.
  const fade = useFocusFade(0)

  return (
    <View
      style={[styles.wrapper, { paddingTop: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[styles.content, fade.style]}
        pointerEvents={fade.isFocusMode ? 'none' : 'box-none'}
      >
        <TaskButton />
        <View style={styles.rightGroup}>
          <AudioPill />
          <SettingsButton />
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
})
