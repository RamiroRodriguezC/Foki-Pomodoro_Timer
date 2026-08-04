import { useEffect } from 'react'
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { selectIsFocusMode, useAppStore } from '../../stores/useAppStore'

// Duración del fade de entrada/salida de Focus Mode (AGENTS 4.5).
export const FOCUS_FADE_DURATION = 400

/**
 * Opacidad animada sincronizada con Focus Mode (única fuente de verdad:
 * `selectIsFocusMode` — focus corriendo y setting activo).
 *
 * Cuando el focus mode se activa, la opacidad anima a `focusedOpacity`; al
 * desactivarse (pausa, cambio de fase o toggle OFF), vuelve a
 * `unfocusedOpacity`. Mismo 400ms `withTiming` en ambos sentidos.
 *
 * Uso típico:
 * - Desaparecer:  `useFocusFade(0)`            (opacidad 1 fuera de focus)
 * - Atenuar:      `useFocusFade(Colors.focusFadeOpacity)`
 * - Aparecer:     `useFocusFade(1, 0)`         (halo del dial: solo en focus)
 */
export function useFocusFade(focusedOpacity: number, unfocusedOpacity = 1) {
  const isFocusMode = useAppStore(selectIsFocusMode)
  const opacity = useSharedValue(isFocusMode ? focusedOpacity : unfocusedOpacity)

  useEffect(() => {
    opacity.value = withTiming(isFocusMode ? focusedOpacity : unfocusedOpacity, {
      duration: FOCUS_FADE_DURATION,
    })
  }, [isFocusMode, focusedOpacity, unfocusedOpacity, opacity])

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))

  return { style, isFocusMode }
}
