import React, { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg'
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { Colors } from '../../constants/Colors'
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

const AnimatedPath = Animated.createAnimatedComponent(Path)

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

  const accent = PHASE_ACCENTS[phase]

  const center = size / 2
  const baseRadius = size / 2 - RING_STROKE_WIDTH / 2
  const wedgeRadius = size / 2 - RING_STROKE_WIDTH

  const animatedProps = useAnimatedProps(() => {
    return {
      d: getWedgePath(center, center, wedgeRadius, animatedAngle.value),
    }
  })

  const gradientId = useMemo(() => `clock-gradient-${phase}`, [phase])

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.gradientStart} />
            <Stop offset="50%" stopColor={Colors.gradientMid} />
            <Stop offset="100%" stopColor={accent.gradientEndColor} />
          </LinearGradient>
        </Defs>

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
