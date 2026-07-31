import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { Colors } from '../../constants/Colors'
import { useTaskStore, selectQueuedTasks } from '../../stores/useTaskStore'
import { useAppStore } from '../../stores/useAppStore'

export function QueueButton() {
  const queueCount = useTaskStore((state) => selectQueuedTasks(state).length)
  const openPanel = useAppStore((state) => state.openPanel)

  if (queueCount === 0) return null

  return (
    <Pressable onPress={() => openPanel('queue')} style={styles.pressable} hitSlop={8}>
      <Text style={styles.label}>Cola · {queueCount}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: { fontSize: 12, fontWeight: '600', letterSpacing: 1, color: Colors.textSecondary },
})
