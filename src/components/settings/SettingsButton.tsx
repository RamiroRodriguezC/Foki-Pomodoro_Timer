import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { Colors } from '../../constants/Colors'
import { useAppStore } from '../../stores/useAppStore'

export function SettingsButton() {
  const openPanel = useAppStore((state) => state.openPanel)

  return (
    <Pressable
      onPress={() => openPanel('settings')}
      style={styles.pressable}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Abrir ajustes"
    >
      <Feather name="settings" size={18} color={Colors.textSecondary} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    padding: 8,
  },
})