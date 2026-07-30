import React from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { Colors } from '../../constants/Colors'
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

export function PomodoroLabel({ phase, isIdle, onPress }: PomodoroLabelProps) {
  return (
    <Pressable
      onPress={isIdle ? onPress : undefined}
      disabled={!isIdle}
      style={styles.pressable}
    >
      <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'center',
  },
  phaseLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
  },
})
