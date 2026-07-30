import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { Colors } from '../../constants/Colors'
import type { TimerPhase } from '../../types'

interface PomodoroLabelProps {
  phase: TimerPhase
}

const PHASE_LABELS: Record<TimerPhase, string> = {
  focus: 'Focus',
  break: 'Break',
  longBreak: 'Long Break',
}

export function PomodoroLabel({ phase }: PomodoroLabelProps) {
  return <Text style={styles.phaseLabel}>{PHASE_LABELS[phase]}</Text>
}

const styles = StyleSheet.create({
  phaseLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
  },
})
