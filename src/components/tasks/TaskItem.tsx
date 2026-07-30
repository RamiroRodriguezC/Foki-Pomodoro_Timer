// src/components/tasks/TaskItem.tsx
import React, { useEffect } from 'react'
import { Platform, Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/Colors'
import { useTaskStore } from '../../stores/useTaskStore'
import type { Task } from '../../types'

interface TaskItemProps {
  task: Task
  isPrimary: boolean
}

// Tras tocar: se tacha visualmente y desaparece a los 1.5s (FR6).
// La tarea siguiente asciende sola porque selectActiveTasks recalcula
// contra el array reindexado — no hay lógica de "ascenso" acá (Regla #8).
const REMOVE_DELAY_MS = 300
const STRIKE_ANIMATION_DURATION = 200

export function TaskItem({ task, isPrimary }: TaskItemProps) {
  const toggleTask = useTaskStore((state) => state.toggleTask)
  const removeTask = useTaskStore((state) => state.removeTask)

  const strikeProgress = useSharedValue(task.completed ? 1 : 0)

  useEffect(() => {
    strikeProgress.value = withTiming(task.completed ? 1 : 0, {
      duration: STRIKE_ANIMATION_DURATION,
    })
  }, [task.completed, strikeProgress])

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: 1 - strikeProgress.value * 0.5,
  }))

  const handlePress = () => {
    if (task.completed) return
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    }
    toggleTask(task.id)
    setTimeout(() => removeTask(task.id), REMOVE_DELAY_MS)
  }

  return (
    <Animated.View
      style={styles.wrapper}
      exiting={FadeOut.duration(300)}
      layout={LinearTransition.springify()}
    >
      <Pressable onPress={handlePress} style={styles.pressable} hitSlop={8}>
        <View style={[styles.checkbox, task.completed && styles.checkboxChecked]} />
        <Animated.Text
          style={[
            isPrimary ? styles.textPrimary : styles.textSecondary,
            animatedTextStyle,
            task.completed && styles.textStrike,
          ]}
          numberOfLines={1}
        >
          {task.text}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  checkboxChecked: {
    backgroundColor: Colors.accentGreen,
    borderColor: Colors.accentGreen,
  },
  textPrimary: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  textSecondary: {
    fontSize: 14,
    fontWeight: '400',
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  textStrike: {
    textDecorationLine: 'line-through',
  },
})