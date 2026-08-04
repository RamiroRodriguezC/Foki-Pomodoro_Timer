import React from 'react'
import { StyleSheet } from 'react-native'
import Animated from 'react-native-reanimated'
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg'
import { Colors } from '../../constants/Colors'
import { useFocusFade } from './useFocusFade'

const VIEWBOX_WIDTH = 800
const VIEWBOX_HEIGHT = 500

/**
 * Fondo "Mesh Gradient": gradiente lineal vertical profundo + glow radial
 * inferior-centrado de rosa oscuro para unificar la base. Un único SVG
 * full-screen, estático; solo se anima su opacidad en Focus Mode (se atenúa
 * a `focusFadeOpacity` para que el dial y la tarea #1 sean lo único presente).
 */
export function MeshBackground() {
  const fade = useFocusFade(Colors.focusFadeOpacity)

  return (
    <Animated.View style={[StyleSheet.absoluteFill, fade.style]} pointerEvents="none">
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <Defs>
          <RadialGradient id="bg_violet" cx="50%" cy="50%" r="80%">
            <Stop offset="0%" stopColor="#140b2e" />
            <Stop offset="50%" stopColor="#0c0a24" />
            <Stop offset="100%" stopColor="#050510" />
          </RadialGradient>
          <RadialGradient id="glow_violet" cx="50%" cy="80%" r="60%">
            <Stop offset="0%" stopColor="#2d124d" stopOpacity="0.25" />
            <Stop offset="100%" stopColor="#050510" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#bg_violet)" />
        <Rect x={0} y={0} width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="url(#glow_violet)" />
      </Svg>
    </Animated.View>
  )
}