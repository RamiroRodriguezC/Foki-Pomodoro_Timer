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
    marginTop: 20,
    fontSize: 32,
    fontWeight: '500',
    color: Colors.textBright,
  },
})
