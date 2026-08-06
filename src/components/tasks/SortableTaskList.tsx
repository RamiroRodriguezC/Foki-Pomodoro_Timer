import React, { useEffect, useMemo } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { Colors } from '../../constants/Colors'
import type { Task } from '../../types'

// Altura fija de cada fila del drawer (única fuente: TaskDrawer la importa).
export const TASK_ROW_HEIGHT = 56

const SPRING_CONFIG = { damping: 18, stiffness: 220 }

// Mapa id → posición actual. El "máx. 3 activas" no vive acá: el orden
// completo se reordena y los selectores del store derivan (Regla #8).
const listToObject = (list: { id: string }[]): Record<string, number> => {
  const object: Record<string, number> = {}
  for (let i = 0; i < list.length; i++) {
    object[list[i].id] = i
  }
  return object
}

// Desplaza el id de `from` a `to` corriendo a los demás en sentido contrario
// (misma semántica que el drag & drop anterior, pero en worklet propio).
const objectMove = (
  object: Record<string, number>,
  from: number,
  to: number
): Record<string, number> => {
  'worklet'
  const newObject = Object.assign({}, object)
  const movedUp = to < from
  for (const id in object) {
    if (object[id] === from) {
      newObject[id] = to
      continue
    }
    const currentPosition = object[id]
    if (movedUp && currentPosition >= to && currentPosition < from) {
      newObject[id]++
    } else if (currentPosition <= to && currentPosition > from) {
      newObject[id]--
    }
  }
  return newObject
}

const clamp = (value: number, lowerBound: number, upperBound: number): number => {
  'worklet'
  return Math.max(lowerBound, Math.min(value, upperBound))
}

const orderFromPositions = (positions: Record<string, number>): string[] => {
  'worklet'
  const ids = Object.keys(positions)
  const ordered: string[] = new Array(ids.length)
  for (let i = 0; i < ids.length; i++) {
    ordered[positions[ids[i]]] = ids[i]
  }
  return ordered
}

const triggerHaptic = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

interface SortableTaskListProps {
  tasks: Task[]
  onReorder: (orderedIds: string[]) => void
  /** El nodo `handle` (zona de drag) lo arma el sortable; la fila solo lo ubica. */
  renderRow: (task: Task, isCurrent: boolean, handle: React.ReactNode) => React.ReactNode
}

// Lista reordenable nativa: filas en position:absolute que se desplazan con
// un spring; el drag vive en el handle (DragHandle) y al soltar se persiste
// el orden completo en el store. Web no pasa por acá (usa ▲/▼ en TaskDrawer).
export function SortableTaskList({ tasks, onReorder, renderRow }: SortableTaskListProps) {
  const positions = useSharedValue<Record<string, number>>(listToObject(tasks))
  const activeId = useSharedValue<string | null>(null)
  const translationY = useSharedValue(0)

  // Re-sincroniza ante cambios externos (agregar/borrar/promover de la cola).
  // Tras un drop los valores ya coinciden con el nuevo orden → sin salto.
  useEffect(() => {
    positions.value = listToObject(tasks)
  }, [tasks, positions])

  return (
    <View style={[styles.container, { height: tasks.length * TASK_ROW_HEIGHT }]}>
      {tasks.map((task) => (
        <SortableRow
          key={task.id}
          id={task.id}
          positions={positions}
          activeId={activeId}
          translationY={translationY}
        >
          {renderRow(
            task,
            task.id === tasks[0]?.id,
            <DragHandle
              id={task.id}
              positions={positions}
              activeId={activeId}
              translationY={translationY}
              itemCount={tasks.length}
              onReorder={onReorder}
            />
          )}
        </SortableRow>
      ))}
    </View>
  )
}

interface SortableRowProps {
  id: string
  positions: ReturnType<typeof useSharedValue<Record<string, number>>>
  activeId: ReturnType<typeof useSharedValue<string | null>>
  translationY: ReturnType<typeof useSharedValue<number>>
  children: React.ReactNode
}

// Fila absoluta: su translateY es la posición en el mapa (spring al reposar);
// mientras es la activa sigue el dedo con translationY y sube en z.
function SortableRow({ id, positions, activeId, translationY, children }: SortableRowProps) {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeId.value === id
    // Fallback defensivo: el effect de sync corre post-paint; ante un cambio
    // externo (borrar/agregar) hay un frame con el mapa viejo.
    const baseY = (positions.value[id] ?? 0) * TASK_ROW_HEIGHT
    return {
      transform: [
        {
          translateY: isActive
            ? baseY + translationY.value
            : withSpring(baseY, SPRING_CONFIG),
        },
      ],
      zIndex: isActive ? 1 : 0,
      shadowOpacity: isActive ? 0.25 : 0,
      elevation: isActive ? 8 : 0,
    }
  })

  return <Animated.View style={[styles.row, animatedStyle]}>{children}</Animated.View>
}

interface DragHandleProps {
  id: string
  positions: ReturnType<typeof useSharedValue<Record<string, number>>>
  activeId: ReturnType<typeof useSharedValue<string | null>>
  translationY: ReturnType<typeof useSharedValue<number>>
  itemCount: number
  onReorder: (orderedIds: string[]) => void
}

// Zona de drag (grip de 6 puntitos): único punto de la fila que inicia el pan.
// shouldCancelWhenOutside(false): el dedo sale del handle pero el arrastre
// sigue sobre el resto de la lista.
function DragHandle({ id, positions, activeId, translationY, itemCount, onReorder }: DragHandleProps) {
  // Baseline del drag capturado UNA VEZ en onStart: positions.value[id] muta
  // durante el arrastre (objectMove), usarlo como baseline en cada update
  // duplicaba el desplazamiento y saltaba de la cima al fondo de un tirón.
  const startIndex = useSharedValue(0)

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .activeOffsetY([-8, 8])
        .shouldCancelWhenOutside(false)
        .onStart(() => {
          activeId.value = id
          startIndex.value = positions.value[id] ?? 0
          translationY.value = 0
          runOnJS(triggerHaptic)()
        })
        .onUpdate((event) => {
          translationY.value = event.translationY
          const target = clamp(
            Math.round((startIndex.value * TASK_ROW_HEIGHT + event.translationY) / TASK_ROW_HEIGHT),
            0,
            itemCount - 1
          )
          if (target !== positions.value[id]) {
            positions.value = objectMove(positions.value, positions.value[id], target)
          }
        })
        .onEnd(() => {
          const ordered = orderFromPositions(positions.value)
          activeId.value = null
          translationY.value = 0
          if (ordered.length === itemCount) {
            runOnJS(onReorder)(ordered)
          }
        }),
    [id, positions, activeId, translationY, itemCount, onReorder, startIndex]
  )

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.handle}>
        <View style={styles.handleCol}>
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
        </View>
        <View style={styles.handleCol}>
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
        </View>
      </View>
    </GestureDetector>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
  },
  row: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: TASK_ROW_HEIGHT,
    backgroundColor: Colors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  handle: { paddingLeft: 10, flexDirection: 'row', gap: 3 },
  handleCol: { gap: 3 },
  handleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted },
})
