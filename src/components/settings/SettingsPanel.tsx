import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Colors } from '../../constants/Colors'
import { useAppStore } from '../../stores/useAppStore'
import { DEFAULT_SETTINGS } from '../../types'
import { NumberStepper } from './NumberStepper'
import { Switch } from '../ui/Switch'
import { InfoButton } from '../ui/InfoButton'

const MIN_MINUTES = 1
const MAX_MINUTES = 120
const MIN_SESSIONS = 1
const MAX_SESSIONS = 12

export function SettingsPanel() {
  const config = useAppStore((state) => state.settings.config)
  const focusModeEnabled = useAppStore((state) => state.settings.focusModeEnabled)
  const status = useAppStore((state) => state.timer.status)
  const updateSessionConfig = useAppStore((state) => state.updateSessionConfig)
  const setFocusModeEnabled = useAppStore((state) => state.setFocusModeEnabled)

  const disabled = status !== 'idle'

  const handleRestoreDefaults = () => {
    if (disabled) return
    updateSessionConfig(DEFAULT_SETTINGS.config)
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Ajustes</Text>

      <NumberStepper
        label="Focus"
        value={config.focusMinutes}
        onChange={(focusMinutes) => updateSessionConfig({ focusMinutes })}
        min={MIN_MINUTES}
        max={MAX_MINUTES}
        suffix="min"
        disabled={disabled}
      />
      <NumberStepper
        label="Descanso"
        value={config.breakMinutes}
        onChange={(breakMinutes) => updateSessionConfig({ breakMinutes })}
        min={MIN_MINUTES}
        max={MAX_MINUTES}
        suffix="min"
        disabled={disabled}
      />
      <NumberStepper
        label="Descanso largo"
        value={config.longBreakMinutes}
        onChange={(longBreakMinutes) => updateSessionConfig({ longBreakMinutes })}
        min={MIN_MINUTES}
        max={MAX_MINUTES}
        suffix="min"
        disabled={disabled}
      />
      <NumberStepper
        label="Sesiones antes del descanso largo"
        value={config.sessionsBeforeLongBreak}
        onChange={(sessionsBeforeLongBreak) => updateSessionConfig({ sessionsBeforeLongBreak })}
        min={MIN_SESSIONS}
        max={MAX_SESSIONS}
        disabled={disabled}
      />

      {/* Focus Mode: mismo patrón (Switch + InfoButton) que "Reproducción
          inteligente" en AudioSheet — el switch nunca se deshabilita. */}
      <View style={styles.focusModeRow}>
        <View style={styles.focusModeLabelRow}>
          <Text style={styles.focusModeText}>Focus Mode</Text>
          <InfoButton text="Durante una sesión de concentración, todo se atenúa y desaparece excepto el reloj y tu tarea principal: nada que distraiga, solo foco." />
        </View>
        <Switch
          value={focusModeEnabled}
          onChange={setFocusModeEnabled}
          accessibilityLabel="Focus Mode"
        />
      </View>

      <Pressable
        onPress={handleRestoreDefaults}
        disabled={disabled}
        style={[styles.restoreBtn, disabled && styles.restoreBtnDisabled]}
        hitSlop={8}
      >
        <Text style={styles.restoreText}>Restablecer valores de fábrica</Text>
      </Pressable>

      {disabled && (
        <Text style={styles.hint}>Reiniciá o cancelá la sesión para poder editar los tiempos</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textBright,
    marginBottom: 16,
  },
  focusModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  focusModeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  focusModeText: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  restoreBtn: {
    marginTop: 4,
    alignSelf: 'center',
    paddingVertical: 8,
  },
  restoreBtnDisabled: {
    opacity: 0.3,
  },
  restoreText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.danger,
  },
  hint: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
})