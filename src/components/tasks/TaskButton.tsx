import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { Colors } from '../../constants/Colors'
import { useAppStore } from '../../stores/useAppStore'

export function TaskButton() {
  const openPanel = useAppStore((state) => state.openPanel)

  return (
    <Pressable
      onPress={() => openPanel('tasks')}
      style={styles.pressable}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel="Abrir tareas"
    >
      <Feather name="list" size={18} color={Colors.textSecondary} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    padding: 8,
  },
})