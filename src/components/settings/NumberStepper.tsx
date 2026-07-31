import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Colors } from '../../constants/Colors'

interface NumberStepperProps {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  suffix?: string
  disabled?: boolean
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max)

export function NumberStepper({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
  disabled = false,
}: NumberStepperProps) {
  const [text, setText] = useState(String(value))

  // Sincroniza el texto si el valor cambia desde afuera (ej. rehidratación
  // del store) — solo importa mientras el input no está en foco, ya que
  // estos steppers se deshabilitan por completo fuera de 'idle'.
  React.useEffect(() => {
    setText(String(value))
  }, [value])

  const commit = (next: number) => {
    const clamped = clamp(next, min, max)
    setText(String(clamped))
    onChange(clamped)
  }

  const handleDecrement = () => {
    if (disabled) return
    commit(value - 1)
  }

  const handleIncrement = () => {
    if (disabled) return
    commit(value + 1)
  }

  const handleChangeText = (raw: string) => {
    // Solo dígitos — nada de negativos ni decimales acá.
    setText(raw.replace(/[^0-9]/g, ''))
  }

  const handleBlur = () => {
    const parsed = parseInt(text, 10)
    if (Number.isNaN(parsed)) {
      setText(String(value))
      return
    }
    commit(parsed)
  }

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          onPress={handleDecrement}
          disabled={disabled || value <= min}
          hitSlop={8}
          style={[styles.btn, (disabled || value <= min) && styles.btnDisabled]}
        >
          <Text style={styles.btnText}>−</Text>
        </Pressable>

        <View style={[styles.inputWrapper, disabled && styles.inputWrapperDisabled]}>
          <TextInput
            value={text}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            editable={!disabled}
            keyboardType="number-pad"
            style={styles.input}
            selectTextOnFocus
          />
          {suffix ? <Text style={styles.suffix}>{suffix}</Text> : null}
        </View>

        <Pressable
          onPress={handleIncrement}
          disabled={disabled || value >= max}
          hitSlop={8}
          style={[styles.btn, (disabled || value >= max) && styles.btnDisabled]}
        >
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.3,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.backgroundElevated,
  },
  inputWrapperDisabled: {
    opacity: 0.5,
  },
  input: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textBright,
    textAlign: 'center',
    minWidth: 30,
    padding: 0,
  },
  suffix: {
    fontSize: 12,
    color: Colors.textMuted,
  },
})