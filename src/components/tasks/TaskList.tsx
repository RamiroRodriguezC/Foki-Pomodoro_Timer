// src/components/tasks/TaskList.tsx
import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useShallow } from 'zustand/react/shallow'
import { TaskItem } from './TaskItem'
import { useTaskStore, selectActiveTasks } from '../../stores/useTaskStore'

export function TaskList() {
  const activeTasks = useTaskStore(useShallow(selectActiveTasks))

  return (
    <View style={styles.wrapper}>
      {activeTasks.map((task, index) => (
        <TaskItem key={task.id} task={task} isPrimary={index === 0} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 320,
    marginTop: 24,
    gap: 2,
  },
})