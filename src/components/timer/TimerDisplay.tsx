import React from 'react'
import { StyleSheet, Text } from 'react-native'
import { Colors } from '../../constants/Colors'

interface TimerDisplayProps {
  label: string
}

export function TimerDisplay({ label }: TimerDisplayProps) {
  return <Text style={styles.timeText}>{label}</Text>
}

const styles = StyleSheet.create({
  timeText: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 3,
    color: Colors.textSecondary,
  },
})
