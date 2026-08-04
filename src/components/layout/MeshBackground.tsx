import React from 'react'
import { StyleSheet } from 'react-native'
import Svg, {
  Circle,
  Defs,
  FeGaussianBlur,
  Filter,
  Rect,
} from 'react-native-svg'

const VIEWBOX = 1000

// Desenfoque gaussiano en unidades del viewBox: extremo para que los orbes
// no se perciban como círculos, solo como manchas de luz difusa. A mayor
// desviación, más se dispersa la luz y menos definido queda el orbe.
const BLUR_STD_DEVIATION = 70

// Fondo base: negro azulado muy profundo, casi negro absoluto.
const BASE_COLOR = '#08070D'

interface Orb {
  cx: number
  cy: number
  r: number
  color: string
  opacity: number
}

// Mesh blur: neblina de color casi imperceptible en un espacio profundo.
// Dos orbes chicos empujados a las esquinas extremas; con slice en viewBox
// cuadrado, portrait ve la banda x∈[240,660] y desktop ve y∈[100,900], así
// que los centros quedan apenas fuera de esas bandas y el halo entra desde
// las esquinas en ambas plataformas. Centro limpio: el dial y el texto
// blanco no compiten con nada.
const ORBS: Orb[] = [
  { cx: 220, cy: 40, r: 140, color: '#321A5A', opacity: 0.25 }, // violeta apagado, arriba-izq
  { cx: 780, cy: 960, r: 90, color: '#4F1442', opacity: 0.2 }, // magenta oscuro, abajo-der
]

/**
 * Fondo "Mesh Gradient": un único SVG full-screen con orbes desenfocados vía
 * <FeGaussianBlur> (implementado en nativo + web) sobre base plana oscura.
 * Estático: se renderiza una vez, sin animación ni re-renders.
 */
export function MeshBackground() {
  return (
    <Svg
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        {/* Región ampliada: el default (-10%..120% del bbox) recortaría el
            halo de los orbes con blur alto. El blur se mide en unidades del
            viewBox (primitiveUnits default = userSpaceOnUse), constante. */}
        <Filter
          id="orb-blur"
          x="-100%"
          y="-100%"
          width="300%"
          height="300%"
          filterUnits="objectBoundingBox"
        >
          <FeGaussianBlur in="SourceGraphic" stdDeviation={BLUR_STD_DEVIATION} />
        </Filter>
      </Defs>

      <Rect x={0} y={0} width={VIEWBOX} height={VIEWBOX} fill={BASE_COLOR} />

      {ORBS.map((orb, index) => (
        <Circle
          key={index}
          cx={orb.cx}
          cy={orb.cy}
          r={orb.r}
          fill={orb.color}
          opacity={orb.opacity}
          filter="url(#orb-blur)"
        />
      ))}
    </Svg>
  )
}
