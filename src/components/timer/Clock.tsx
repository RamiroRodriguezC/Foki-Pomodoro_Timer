import React, { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Colors } from '../../constants/Colors'
import { selectIsFocusMode, useAppStore } from '../../stores/useAppStore'
import { FOCUS_FADE_DURATION } from '../layout/useFocusFade'
import type { TimerPhase } from '../../types'

interface ClockProps {
  /** Fracción de tiempo RESTANTE: 1 = círculo lleno (recién iniciado), 0 = vacío (terminó) */
  progress: number
  phase: TimerPhase
  /** Diámetro del círculo */
  size?: number
}

interface PhaseAccent {
  ringColor: string
  gradientEndColor: string
}

const PHASE_ACCENTS: Record<TimerPhase, PhaseAccent> = {
  focus: {
    ringColor: Colors.gradientStart,
    gradientEndColor: Colors.gradientEnd,
  },
  break: {
    ringColor: Colors.accentOne,
    gradientEndColor: Colors.accentOne,
  },
  longBreak: {
    ringColor: Colors.accentTwo,
    gradientEndColor: Colors.accentTwo,
  },
}

const RING_STROKE_WIDTH = 4
const ANIMATION_DURATION = 950

// Extensión del halo de Focus Mode más allá del anillo del dial. El canvas
// SVG crece HALO_EXTENT*2 para que el halo no quede recortado por el viewport.
const HALO_EXTENT = 16
// Pico de opacidad del halo dentro del gradiente radial — "no demasiado
// luminoso" (AGENTS 4.5).
const HALO_PEAK_OPACITY = 0.35

const AnimatedPath = Animated.createAnimatedComponent(Path)
const AnimatedCircle = Animated.createAnimatedComponent(Circle)

/**
 * Calcula el path SVG de un wedge (porción de pie) sólido que arranca en la
 * posición de las 12 (0°) y crece en sentido horario hasta `angleDeg`.
 *
 * Sistema de coordenadas: el ángulo se mide en sentido horario desde arriba
 * (12 en punto), no desde la derecha (3 en punto) como es la convención
 * trigonométrica estándar. Por eso el punto sobre el círculo para un ángulo
 * dado se calcula como:
 *   x = cx + r * sin(angleRad)
 *   y = cy - r * cos(angleRad)
 * (en vez del x = cx + r*cos, y = cy + r*sin habitual), lo que efectivamente
 * rota el origen 90° y compensa el eje Y invertido de SVG (crece hacia abajo).
 *
 * Cuando el ángulo cubre el círculo completo (>= 360°) el arco se vuelve
 * degenerado (punto de inicio == punto de fin), por lo que se dibuja el
 * círculo completo como dos arcos semicirculares en su lugar.
 */
function getWedgePath(cx: number, cy: number, r: number, angleDeg: number): string {
  'worklet'

  const clampedAngle = Math.min(Math.max(angleDeg, 0), 360)

  if (clampedAngle <= 0) {
    return `M ${cx} ${cy} L ${cx} ${cy} Z`
  }

  if (clampedAngle >= 360) {
    // Círculo completo: dos arcos semicirculares desde el punto superior.
    const topX = cx
    const topY = cy - r
    const bottomX = cx
    const bottomY = cy + r
    return [
      `M ${topX} ${topY}`,
      `A ${r} ${r} 0 1 1 ${bottomX} ${bottomY}`,
      `A ${r} ${r} 0 1 1 ${topX} ${topY}`,
      'Z',
    ].join(' ')
  }

  const angleRad = (clampedAngle * Math.PI) / 180
  const startX = cx
  const startY = cy - r
  const endX = cx + r * Math.sin(angleRad)
  const endY = cy - r * Math.cos(angleRad)
  const largeArcFlag = clampedAngle > 180 ? 1 : 0
  const sweepFlag = 1 // sentido horario

  return [
    `M ${cx} ${cy}`,
    `L ${startX} ${startY}`,
    `A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`,
    'Z',
  ].join(' ')
}

export function Clock({ progress, phase, size = 260 }: ClockProps) {
  const clampedProgress = Math.min(Math.max(progress, 0), 1)
  const animatedAngle = useSharedValue(clampedProgress * 360)

  useEffect(() => {
    animatedAngle.value = withTiming(clampedProgress * 360, {
      duration: ANIMATION_DURATION,
    })
  }, [clampedProgress, animatedAngle])

  // Halo de Focus Mode: visible únicamente mientras corre una sesión de focus.
  const isFocusMode = useAppStore(selectIsFocusMode)
  const haloOpacity = useSharedValue(isFocusMode ? 1 : 0)

  useEffect(() => {
    haloOpacity.value = withTiming(isFocusMode ? 1 : 0, {
      duration: FOCUS_FADE_DURATION,
    })
  }, [isFocusMode, haloOpacity])

  const haloProps = useAnimatedProps(() => ({ opacity: haloOpacity.value }))

  const accent = PHASE_ACCENTS[phase]

  const svgSize = size + HALO_EXTENT * 2
  const center = svgSize / 2
  const baseRadius = size / 2 - RING_STROKE_WIDTH / 2
  const wedgeRadius = size / 2 - RING_STROKE_WIDTH
  const haloRadius = size / 2 + HALO_EXTENT

  const animatedProps = useAnimatedProps(() => {
    return {
      d: getWedgePath(center, center, wedgeRadius, animatedAngle.value),
    }
  })

  const gradientId = useMemo(() => `clock-gradient-${phase}`, [phase])

  return (
    <View style={styles.wrapper}>
      <Svg width={svgSize} height={svgSize}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.gradientStart} />
            <Stop offset="50%" stopColor={Colors.gradientMid} />
            <Stop offset="100%" stopColor={accent.gradientEndColor} />
          </LinearGradient>

          {/* Halo de Focus Mode: anillo radial morado en el borde del dial.
              El gradiente codifica la forma (transparente → pico → transparente);
              la opacidad del círculo anima 0↔1 con el fade de focus mode. */}
          <RadialGradient id="clock-halo" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={Colors.gradientStart} stopOpacity={0} />
            <Stop offset="70%" stopColor={Colors.gradientStart} stopOpacity={0} />
            <Stop offset="88%" stopColor={Colors.gradientStart} stopOpacity={HALO_PEAK_OPACITY} />
            <Stop offset="100%" stopColor={Colors.gradientStart} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Halo (solo focus mode) — detrás del disco base */}
        <AnimatedCircle
          animatedProps={haloProps}
          cx={center}
          cy={center}
          r={haloRadius}
          fill="url(#clock-halo)"
        />

        {/* Disco base: fondo del reloj (tiempo ya consumido) */}
        <Circle
          cx={center}
          cy={center}
          r={wedgeRadius}
          fill={Colors.backgroundElevated}
        />

        {/* Wedge de progreso: representa el tiempo restante — lleno al iniciar,
            se vacía en sentido horario hasta 0° al llegar a 00:00 */}
        <AnimatedPath animatedProps={animatedProps} fill={`url(#${gradientId})`} />

        {/* Anillo exterior estático, marco de la fase activa */}
        <Circle
          cx={center}
          cy={center}
          r={baseRadius}
          stroke={accent.ringColor}
          strokeWidth={RING_STROKE_WIDTH}
          fill="none"
        />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
})
