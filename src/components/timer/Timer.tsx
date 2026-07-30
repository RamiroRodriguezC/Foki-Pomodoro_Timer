import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { Clock } from './Clock'
import { useAppStore, phaseDurationMinutes } from '../../stores/useAppStore'

function formatMMSS(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function Timer() {
  const timer = useAppStore((state) => state.timer)
  const settings = useAppStore((state) => state.settings)
  const getRemainingSeconds = useAppStore((state) => state.getRemainingSeconds)
  const startFocus = useAppStore((state) => state.startFocus)
  const pauseTimer = useAppStore((state) => state.pauseTimer)
  const resumeTimer = useAppStore((state) => state.resumeTimer)
  const completePhase = useAppStore((state) => state.completePhase)

  // Solo dispara re-renders cada 1s (Regla dura #12) — el valor mostrado
  // siempre sale de recalcular contra Date.now(), nunca de este contador.
  const [, forceTick] = useState(0)

  useEffect(() => {
    if (!timer.isRunning) return

    const id = setInterval(() => {
      if (getRemainingSeconds() <= 0) {
        completePhase()
      } else {
        forceTick((t) => t + 1)
      }
    }, 1000)

    return () => clearInterval(id)
  }, [timer.isRunning, timer.phaseEndsAt, getRemainingSeconds, completePhase])

  const remainingSeconds = getRemainingSeconds()
  const totalSeconds = phaseDurationMinutes(timer.phase, settings.config) * 60
  const progress = totalSeconds > 0 ? 1 - remainingSeconds / totalSeconds : 0
  const hasStarted = timer.phaseEndsAt !== null || timer.remainingSecondsPaused !== null

  const handlePress = () => {
    if (!hasStarted) {
      startFocus()
    } else if (timer.isRunning) {
      pauseTimer()
    } else {
      resumeTimer()
    }
  }

  return (
    <Pressable onPress={handlePress} style={styles.wrapper}>
      <Clock
        progress={progress}
        phase={timer.phase}
        timeLeftLabel={formatMMSS(remainingSeconds)}
      />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
