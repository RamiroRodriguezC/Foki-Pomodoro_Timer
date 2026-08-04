import React, { useCallback, useEffect } from 'react'
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Sortable, SortableItem, SortableRenderItemProps } from 'react-native-reanimated-dnd'
import { useShallow } from 'zustand/react/shallow'
import Animated, {
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import Feather from '@expo/vector-icons/Feather'
import { Colors } from '../../constants/Colors'
import { useTaskStore, selectAllTasks } from '../../stores/useTaskStore'
import { TaskInput } from './TaskInput'
import type { Task } from '../../types'

const ITEM_HEIGHT = 56
const REMOVE_DELAY_MS = 300
const STRIKE_ANIMATION_DURATION = 200
const isWeb = Platform.OS === 'web'

// Panel de tareas (drawer izquierdo): agregar arriba + lista completa
// reordenable (drag & drop en nativo, ▲/▼ en web) y eliminable.
// La fila de la cima es la "tarea actual" y se resalta.
export function TaskDrawer() {
  const tasks = useTaskStore(useShallow(selectAllTasks))
  const reorderTasks = useTaskStore((state) => state.reorderTasks)
  const moveTask = useTaskStore((state) => state.moveTask)
  const removeTask = useTaskStore((state) => state.removeTask)

  /* --- Native: Sortable con drag & drop (onDrop: id, posición final) --- */
  const handleDrop = useCallback(
    (id: string, position: number) => {
      const ids = tasks.map((task) => task.id)
      const fromIndex = ids.indexOf(id)
      if (fromIndex === -1) return
      const next = [...ids]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(position, 0, moved)
      reorderTasks(next)
    },
    [tasks, reorderTasks]
  )

  const renderSortableItem = useCallback(
    (props: SortableRenderItemProps<Task>) => {
      const { item, id, ...rest } = props
      return (
        <SortableItem
          key={id}
          id={id}
          data={item}
          onDrop={handleDrop}
          style={styles.itemContainer}
          {...rest}
        >
          <TaskRow
            task={item}
            isCurrent={item.id === tasks[0]?.id}
            onDelete={removeTask}
            handle={
              <SortableItem.Handle>
                <View style={styles.handle}>
                  <View style={styles.handleDot} />
                  <View style={styles.handleDot} />
                  <View style={styles.handleDot} />
                </View>
              </SortableItem.Handle>
            }
          />
        </SortableItem>
      )
    },
    [handleDrop, removeTask, tasks]
  )

  const renderWebItem = (task: Task, index: number) => (
    <View key={task.id} style={styles.row}>
      <TaskRow
        task={task}
        isCurrent={index === 0}
        onDelete={removeTask}
        onMove={moveTask}
        moveUpDisabled={index === 0}
        moveDownDisabled={index === tasks.length - 1}
      />
    </View>
  )

  return (
    <View style={styles.wrapper}>
      <Text style={styles.title}>Tareas</Text>
      <TaskInput />

      {tasks.length === 0 ? (
        <View style={styles.emptyWrapper}>
          <Text style={styles.emptyText}>Sin tareas todavía</Text>
        </View>
      ) : isWeb ? (
        /* --- Web sin drag: lista plana con botones ▲/▼ --- */
        <ScrollView style={styles.webList} showsVerticalScrollIndicator={false}>
          {tasks.map(renderWebItem)}
        </ScrollView>
      ) : (
        /* --- Native: Sortable drag & drop --- */
        // Sortable usa position:absolute internamente, no aporta altura al padre.
        // Envolvemos en un View con altura explícita para que el drawer se dimensione bien.
        <View style={[styles.listContainer, { height: tasks.length * ITEM_HEIGHT }]}>
          <Sortable data={tasks} renderItem={renderSortableItem} itemHeight={ITEM_HEIGHT} />
        </View>
      )}
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
  /** Handle de drag nativo (SortableItem.Handle). Null en web. */
  handle?: React.ReactNode
}

// Fila del drawer: tap = completar/tachar (FR6), basurero = eliminar directo,
// y reordenar según plataforma. La tarea actual se resalta.
function TaskRow({
  task,
  isCurrent,
  onDelete,
  onMove,
  moveUpDisabled,
  moveDownDisabled,
  handle,
}: TaskRowProps) {
  const toggleTask = useTaskStore((state) => state.toggleTask)

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

  return (
    <Animated.View style={styles.row} exiting={FadeOut.duration(200)}>
      <Pressable onPress={handleComplete} hitSlop={8} style={styles.completeArea}>
        <View style={[styles.checkbox, task.completed && styles.checkboxChecked]} />
        <Animated.Text
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
      </Pressable>

      {isCurrent ? (
        <View style={styles.currentTag}>
          <Text style={styles.currentTagText}>Actual</Text>
        </View>
      ) : null}

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
  // Contenedor que crea la librería alrededor del item (position:absolute).
  itemContainer: {
    backgroundColor: Colors.surface,
  },
  // Wrapper de altura explícita para el Sortable (nativo).
  listContainer: {
    backgroundColor: Colors.surface,
  },
  webList: {
    flex: 1,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ITEM_HEIGHT,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  completeArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'stretch',
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
  deleteBtn: {
    padding: 6,
  },
  handle: { paddingLeft: 10, gap: 3 },
  handleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted },
  webControls: { flexDirection: 'row', gap: 2 },
  arrowBtn: { padding: 6 },
  arrow: { fontSize: 12, color: Colors.textSecondary },
  arrowDisabled: { opacity: 0.3 },
  emptyWrapper: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textMuted },
})