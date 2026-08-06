import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SortableTaskList, TASK_ROW_HEIGHT } from './SortableTaskList'
import { useShallow } from 'zustand/react/shallow'
import Animated, {
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Feather from '@expo/vector-icons/Feather'
import Svg, { Polygon } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors } from '../../constants/Colors'
import { useAppStore } from '../../stores/useAppStore'
import { useTaskStore, selectAllTasks } from '../../stores/useTaskStore'
import { TaskInput } from './TaskInput'
import type { Task } from '../../types'

const REMOVE_DELAY_MS = 300
const STRIKE_ANIMATION_DURATION = 200
const TOOLTIP_GAP = 8
const TOOLTIP_HIDE_DELAY = 180
const TAIL_WIDTH = 14
const TAIL_HEIGHT = 8
// Padding lateral del panel del Sheet (styles.panelDrawer): el wrapper del
// drawer arranca ahí dentro, y el tooltip se posiciona respecto del panel.
const PANEL_PADDING = 20
const isWeb = Platform.OS === 'web'

// Closer del tooltip registrado por el drawer: el ScrollView web lo invoca
// al scrollear para que la burbuja no quede anclada a una posición vieja.
const tooltipClosers = new Set<() => void>()

// Panel de tareas (drawer izquierdo): agregar arriba + lista completa
// reordenable (drag & drop en nativo, ▲/▼ en web) y eliminable.
// La fila de la cima es la "tarea actual" y se resalta.
export function TaskDrawer() {
  const tasks = useTaskStore(useShallow(selectAllTasks))
  const reorderTasks = useTaskStore((state) => state.reorderTasks)
  const moveTask = useTaskStore((state) => state.moveTask)
  const removeTask = useTaskStore((state) => state.removeTask)
  const closePanel = useAppStore((state) => state.closePanel)
  // El drawer ya no es el panel activo: sus filas no deben jugar su exiting
  // al desmontarse (el panel entero ya se desliza). En web, reanimated clona
  // cada fila a un "fantasma" que su MutationObserver rescata al DOM vivo al
  // remover el contenedor → parpadeo de la lista justo después del slide-out.
  const closing = useAppStore((state) => state.activePanel !== 'tasks')
  const insets = useSafeAreaInsets()

  // Tooltip web (burbuja con piquito): lo posee el drawer para escapar del
  // ScrollView; las filas solo reportan el hover y la geometría del texto.
  const [tooltip, setTooltip] = useState<{
    text: string
    left: number
    top: number
    width: number
  } | null>(null)
  const [tooltipSize, setTooltipSize] = useState<{ width: number; height: number } | null>(null)
  const [wrapperWidth, setWrapperWidth] = useState(0)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hideTooltip = useCallback(() => {
    setTooltip(null)
    setTooltipSize(null)
  }, [])

  const cancelHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
  }, [])

  // Pequeño retardo al salir del texto: permite cruzar el aire hasta la
  // burbuja sin que se cierre (el hover de la burbuja lo cancela).
  const scheduleHide = useCallback(() => {
    cancelHide()
    hideTimer.current = setTimeout(() => {
      hideTimer.current = null
      hideTooltip()
    }, TOOLTIP_HIDE_DELAY)
  }, [cancelHide, hideTooltip])

  // El ScrollView cierra la burbuja al scrollear.
  useEffect(() => {
    tooltipClosers.add(hideTooltip)
    return () => {
      tooltipClosers.delete(hideTooltip)
    }
  }, [hideTooltip])

  const showTooltip = useCallback(
    (task: Task, rect: { left: number; top: number; width: number }) => {
      cancelHide()
      setTooltip({ text: task.text, ...rect })
      setTooltipSize(null)
    },
    [cancelHide]
  )

  /* --- Native: SortableTaskList (drag & drop por handle) --- */
  // El sortable arma el handle y persiste el orden completo con onReorder.
  const renderRow = useCallback(
    (task: Task, isCurrent: boolean, handle: React.ReactNode) => (
      <TaskRow
        task={task}
        isCurrent={isCurrent}
        onDelete={removeTask}
        onTooltipEnter={showTooltip}
        onTooltipLeave={scheduleHide}
        suppressExit={closing}
        handle={handle}
      />
    ),
    [removeTask, showTooltip, scheduleHide, closing]
  )

  const renderWebItem = (task: Task, index: number) => (
    <View key={task.id} style={styles.webRowWrapper}>
      <TaskRow
        task={task}
        isCurrent={index === 0}
        onDelete={removeTask}
        onMove={moveTask}
        moveUpDisabled={index === 0}
        moveDownDisabled={index === tasks.length - 1}
        onTooltipEnter={showTooltip}
        onTooltipLeave={scheduleHide}
        suppressExit={closing}
      />
    </View>
  )

  // Burbuja centrada sobre el texto, con el piquito apuntando al centro del
  // texto; se clampa dentro del ancho del drawer (wrapper del drawer).
  const tooltipLeft =
    tooltip && tooltipSize
      ? PANEL_PADDING +
        Math.max(
          0,
          Math.min(
            tooltip.left + tooltip.width / 2 - PANEL_PADDING - tooltipSize.width / 2,
            wrapperWidth > 0 ? wrapperWidth - tooltipSize.width : tooltipSize.width
          )
        )
      : 0
  const tooltipTop =
    tooltip && tooltipSize
      ? tooltip.top - tooltipSize.height - TAIL_HEIGHT - TOOLTIP_GAP
      : (tooltip?.top ?? 0)

  return (
    <View
      style={styles.wrapper}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w !== wrapperWidth) setWrapperWidth(w)
      }}
    >
      {/* Header alineado con el Topbar: el back queda en el MISMO punto de
          pantalla que el TaskButton (x 16, y insets.top + 8) para toggle ágil. */}
      <View style={[styles.headerRow, { marginTop: insets.top - 12 }]}>
        <Pressable
          onPress={closePanel}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cerrar tareas"
        >
          <Feather name="arrow-left" size={18} color={Colors.textSecondary} />
        </Pressable>
        <Text style={styles.title}>Tareas</Text>
      </View>
      <TaskInput />

      {tasks.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>Sin tareas todavía</Text>
        </View>
      ) : isWeb ? (
        /* --- Web sin drag: lista plana con botones ▲/▼ --- */
        <ScrollView
          style={styles.webList}
          showsVerticalScrollIndicator={false}
          onScroll={() => tooltipClosers.forEach((close) => close())}
        >
          {tasks.map(renderWebItem)}
        </ScrollView>
      ) : (
        /* --- Native: SortableTaskList con drag & drop --- */
        // Las filas son position:absolute, no aportan altura al padre.
        // Envolvemos en un View con altura explícita para que el drawer se dimensione bien.
        <View style={[styles.listContainer, { height: tasks.length * TASK_ROW_HEIGHT }]}>
          <SortableTaskList tasks={tasks} onReorder={reorderTasks} renderRow={renderRow} />
        </View>
      )}

      {/* Burbuja de texto completo (web, solo si el texto está truncado).
          Position absolute respecto del panel del Sheet (tiene transform) y
          fuera del ScrollView: no la recorta ni la tapa ninguna fila. */}
      {isWeb && tooltip ? (
        <View
          style={[
            styles.tooltip,
            tooltipSize
              ? { left: tooltipLeft, top: tooltipTop, opacity: 1 }
              : { left: tooltip.left, top: tooltip.top, opacity: 0 },
          ]}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout
            setTooltipSize((prev) =>
              prev && prev.width === width && prev.height === height ? prev : { width, height }
            )
          }}
          onPointerEnter={cancelHide}
          onPointerLeave={scheduleHide}
        >
          <Text style={styles.tooltipText} numberOfLines={3}>
            {tooltip.text}
          </Text>
          {/* Piquito: triángulo apuntando al centro del texto. */}
          <Svg
            style={styles.tooltipTail}
            width={TAIL_WIDTH}
            height={TAIL_HEIGHT}
            viewBox={`0 0 ${TAIL_WIDTH} ${TAIL_HEIGHT}`}
          >
            <Polygon
              points={`0,0 ${TAIL_WIDTH},0 ${TAIL_WIDTH / 2},${TAIL_HEIGHT}`}
              fill={Colors.surfaceLight}
            />
          </Svg>
        </View>
      ) : null}
    </View>
  )
}

interface TaskRowProps {
  task: Task
  isCurrent: boolean
  onDelete: (id: string) => void
  /** Flechas web ▲/▼. Null en nativo (ahí se pasa el handle del drag). */
  onMove?: (id: string, direction: 'up' | 'down') => void
  moveUpDisabled?: boolean
  moveDownDisabled?: boolean
  /** Handle de drag nativo (grip de 6 puntitos del SortableTaskList). Null en web. */
  handle?: React.ReactNode
  /** Web: hover sobre el texto truncado → el drawer muestra la burbuja. */
  onTooltipEnter: (task: Task, rect: { left: number; top: number; width: number }) => void
  /** Web: el puntero salió de la zona del texto. */
  onTooltipLeave: () => void
  /** El drawer se está cerrando: no jugar el exiting de la fila al desmontar. */
  suppressExit: boolean
}

// Fila del drawer: solo la checkbox tacha/completa (FR6); el texto no es
// pressable — es la zona de hover que reporta el tooltip web. Basurero =
// eliminar directo, y reordenar según plataforma. La tarea actual se resalta.
// Los controles (basurero + flechas/handle) viven en una zona de ancho
// fijo al final de la fila: el texto largo nunca los desplaza.
function TaskRow({
  task,
  isCurrent,
  onDelete,
  onMove,
  moveUpDisabled,
  moveDownDisabled,
  handle,
  onTooltipEnter,
  onTooltipLeave,
  suppressExit,
}: TaskRowProps) {
  const toggleTask = useTaskStore((state) => state.toggleTask)
  const textRef = useRef<Text>(null)

  const strikeProgress = useSharedValue(task.completed ? 1 : 0)

  useEffect(() => {
    strikeProgress.value = withTiming(task.completed ? 1 : 0, {
      duration: STRIKE_ANIMATION_DURATION,
    })
  }, [task.completed, strikeProgress])

  const animatedTextStyle = useAnimatedStyle(() => ({
    opacity: 1 - strikeProgress.value * 0.5,
  }))

  const handleComplete = () => {
    if (task.completed) return
    if (!isWeb) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    }
    toggleTask(task.id)
    setTimeout(() => onDelete(task.id), REMOVE_DELAY_MS)
  }

  // Hover web: la burbuja solo tiene sentido si el texto está truncado
  // (scrollWidth > clientWidth en el nodo DOM del Text).
  const handlePointerEnter = () => {
    if (!isWeb) return
    const textEl = textRef.current as unknown as HTMLElement | null
    if (!textEl || textEl.scrollWidth <= textEl.clientWidth) return
    const rect = textEl.getBoundingClientRect()
    onTooltipEnter(task, { left: rect.left, top: rect.top, width: rect.width })
  }

  return (
    <Animated.View
      style={styles.row}
      exiting={suppressExit ? undefined : FadeOut.duration(200)}
    >
      <Pressable
        onPress={handleComplete}
        hitSlop={12}
        style={[styles.checkbox, task.completed && styles.checkboxChecked]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: task.completed }}
        accessibilityLabel={task.text}
      />

      <View style={styles.textZone} onPointerEnter={handlePointerEnter} onPointerLeave={onTooltipLeave}>
        <Animated.Text
          ref={textRef}
          style={[
            styles.taskText,
            isCurrent && styles.taskTextCurrent,
            animatedTextStyle,
            task.completed && styles.textStrike,
          ]}
          numberOfLines={1}
        >
          {task.text}
        </Animated.Text>
      </View>

      {isCurrent ? (
        <View style={styles.currentTag}>
          <Text style={styles.currentTagText}>Actual</Text>
        </View>
      ) : null}

      <View style={styles.controlsZone}>
        <Pressable
          onPress={() => onDelete(task.id)}
          style={styles.deleteBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Eliminar tarea"
        >
          <Feather name="trash-2" size={15} color={Colors.textMuted} />
        </Pressable>

        {handle ? (
          handle
        ) : onMove ? (
          <View style={styles.webControls}>
            <Pressable
              onPress={() => onMove(task.id, 'up')}
              disabled={moveUpDisabled}
              style={[styles.arrowBtn, moveUpDisabled && styles.arrowDisabled]}
            >
              <Text style={styles.arrow}>▲</Text>
            </Pressable>
            <Pressable
              onPress={() => onMove(task.id, 'down')}
              disabled={moveDownDisabled}
              style={[styles.arrowBtn, moveDownDisabled && styles.arrowDisabled]}
            >
              <Text style={styles.arrow}>▼</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
  },
  // Header del drawer: el back usa la misma geometría que el TaskButton
  // (padding 8 + ícono 18) y -4 compensa el padding 20 del panel vs los
  // 16 del Topbar → misma caja en pantalla para abrir y cerrar.
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: -4,
  },
  backBtn: {
    padding: 8,
  },
  // Wrapper de altura explícita para el SortableTaskList (nativo).
  listContainer: {
    backgroundColor: Colors.surface,
  },
  webList: {
    flex: 1,
    marginTop: 4,
  },
  // Wrapper mínimo de la fila web: solo aporta key y ancho completo.
  webRowWrapper: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: TASK_ROW_HEIGHT,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  checkboxChecked: {
    backgroundColor: Colors.accentOne,
    borderColor: Colors.accentOne,
  },
  // Zona del texto: no-pressable; es el área de hover del tooltip web.
  textZone: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    justifyContent: 'center',
  },
  taskText: {
    fontSize: 15,
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  taskTextCurrent: {
    color: Colors.textBright,
    fontWeight: '600',
  },
  textStrike: {
    textDecorationLine: 'line-through',
  },
  currentTag: {
    marginLeft: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.accentOne,
  },
  currentTagText: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.accentOne,
  },
  // Zona de controles de ancho fijo: el texto largo nunca la desplaza.
  controlsZone: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 84,
    marginLeft: 10,
  },
  deleteBtn: {
    padding: 6,
  },
  webControls: { flexDirection: 'row', gap: 2 },
  arrowBtn: { padding: 6 },
  arrow: { fontSize: 12, color: Colors.textSecondary },
  arrowDisabled: { opacity: 0.3 },
  emptyWrapper: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  tooltip: {
    position: 'absolute',
    zIndex: 1000,
    maxWidth: 280,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tooltipText: {
    fontSize: 13,
    lineHeight: 17,
    color: Colors.textPrimary,
  },
  // Piquito de la burbuja: triángulo SVG solapado 1px sobre el borde inferior.
  tooltipTail: {
    position: 'absolute',
    left: '50%',
    marginLeft: -TAIL_WIDTH / 2,
    bottom: -TAIL_HEIGHT + 1,
  },
})
