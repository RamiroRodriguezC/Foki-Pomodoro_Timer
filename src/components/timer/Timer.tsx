import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { Clock } from './Clock'
import { TimerDisplay } from './TimerDisplay'
import { PomodoroLabel } from './PomodoroLabel'
import { useAppStore, phaseDurationMinutes } from '../../stores/useAppStore'
import { ResetButton } from './ResetButton'

function formatMMSS(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function Timer() {
  const timer = useAppStore((state) => state.timer)
  const settings = useAppStore((state) => state.settings)
  const getRemainingSeconds = useAppStore((state) => state.getRemainingSeconds)
  const startCurrentPhase = useAppStore((state) => state.startCurrentPhase)
  const pauseTimer = useAppStore((state) => state.pauseTimer)
  const resumeTimer = useAppStore((state) => state.resumeTimer)
  const completePhase = useAppStore((state) => state.completePhase)
  const cyclePhase = useAppStore((state) => state.cyclePhase)

  // Solo dispara re-renders cada 1s (Regla dura #12) — el valor mostrado
  // siempre sale de recalcular contra Date.now(), nunca de este contador.
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (timer.status !== 'running') return

    const id = setInterval(() => {
      if (getRemainingSeconds() <= 0) {
        completePhase()
      } else {
        forceTick((t) => t + 1)
      }
    }, 1000)

    return () => clearInterval(id)
  }, [timer.status, timer.phaseEndsAt, getRemainingSeconds, completePhase])

  const remainingSeconds = getRemainingSeconds()
  const totalSeconds = phaseDurationMinutes(timer.phase, settings.config) * 60
  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0

  const handleTogglePress = () => {
    if (timer.status === 'idle') {
      startCurrentPhase()
    } else if (timer.status === 'running') {
      pauseTimer()
    } else {
      resumeTimer()
    }
  }

  return (
    <View style={styles.wrapper}>
      <Pressable onPress={handleTogglePress}>
        <Clock progress={progress} phase={timer.phase} />
      </Pressable>
      <TimerDisplay label={formatMMSS(remainingSeconds)} />
      <PomodoroLabel
        phase={timer.phase}
        isIdle={timer.status === 'idle'}
        onPress={cyclePhase}
      />
      <ResetButton />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
