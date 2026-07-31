import React, { useCallback } from 'react'
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { Sortable, SortableItem, SortableRenderItemProps } from 'react-native-reanimated-dnd'
import { useShallow } from 'zustand/react/shallow'
import { Colors } from '../../constants/Colors'
import { useTaskStore, selectQueuedTasks } from '../../stores/useTaskStore'
import type { Task } from '../../types'

const ITEM_HEIGHT = 56
const isWeb = Platform.OS === 'web'

// Cola de tareas: reordenar con drag & drop real (FR8) y promover a activa (FR9).
// En web (sin soporte de react-native-reanimated-dnd) se usan botones ▲/▼.
export function TaskQueue() {
  const queuedTasks = useTaskStore(useShallow(selectQueuedTasks))
  const reorderQueue = useTaskStore((state) => state.reorderQueue)
  const promoteToActive = useTaskStore((state) => state.promoteToActive)
  const moveTaskInQueue = useTaskStore((state) => state.moveTaskInQueue)

  /* --- Native: Sortable con drag & drop (onDrop + allPositions) --- */
  const handleDrop = useCallback(
    (_id: string, _position: number, allPositions?: Record<string, number>) => {
      if (!allPositions) return
      const orderedIds = [...queuedTasks]
        .sort((a, b) => (allPositions[a.id] ?? 0) - (allPositions[b.id] ?? 0))
        .map((task) => task.id)
      reorderQueue(orderedIds)
    },
    [queuedTasks, reorderQueue]
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
          <View style={styles.row}>
            <Pressable
              style={styles.textArea}
              onPress={() => promoteToActive(item.id)}
              hitSlop={8}
            >
              <Text style={styles.taskText} numberOfLines={1}>
                {item.text}
              </Text>
            </Pressable>
            <SortableItem.Handle>
              <View style={styles.handle}>
                <View style={styles.handleDot} />
                <View style={styles.handleDot} />
                <View style={styles.handleDot} />
              </View>
            </SortableItem.Handle>
          </View>
        </SortableItem>
      )
    },
    [handleDrop, promoteToActive]
  )

  if (queuedTasks.length === 0) {
    return (
      <View style={styles.emptyWrapper}>
        <Text style={styles.emptyText}>No hay tareas en cola</Text>
      </View>
    )
  }

  /* --- Web sin drag: lista plana con botones ▲/▼ --- */
  if (isWeb) {
    return (
      <View>
        {queuedTasks.map((task, index) => (
          <View key={task.id} style={styles.row}>
            <Pressable
              style={styles.textArea}
              onPress={() => promoteToActive(task.id)}
              hitSlop={8}
            >
              <Text style={styles.taskText} numberOfLines={1}>
                {task.text}
              </Text>
            </Pressable>
            <View style={styles.webControls}>
              <Pressable
                onPress={() => moveTaskInQueue(task.id, 'up')}
                disabled={index === 0}
                style={[styles.arrowBtn, index === 0 && styles.arrowDisabled]}
              >
                <Text style={styles.arrow}>▲</Text>
              </Pressable>
              <Pressable
                onPress={() => moveTaskInQueue(task.id, 'down')}
                disabled={index === queuedTasks.length - 1}
                style={[
                  styles.arrowBtn,
                  index === queuedTasks.length - 1 && styles.arrowDisabled,
                ]}
              >
                <Text style={styles.arrow}>▼</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    )
  }

  /* --- Native: Sortable drag & drop --- */
  // Sortable usa position:absolute internamente, no aporta altura al padre.
  // Envolvemos en un View con altura explícita para que el Sheet se dimensione bien.
  const listHeight = queuedTasks.length * ITEM_HEIGHT
  return (
    <View style={[styles.listContainer, { height: listHeight }]}>
      <Sortable data={queuedTasks} renderItem={renderSortableItem} itemHeight={ITEM_HEIGHT} />
    </View>
  )
}

const styles = StyleSheet.create({
  // Contenedor que crea la librería alrededor del item (position:absolute).
  // Sin fondo, los huecos del drag muestran transparente/blanco.
  itemContainer: {
    backgroundColor: Colors.surface,
  },
  // Wrapper de altura explícita — fondo para que los springs del drag no
  // dejen huecos visibles.
  listContainer: {
    backgroundColor: Colors.surface,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: ITEM_HEIGHT,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  textArea: { flex: 1 },
  taskText: { fontSize: 15, color: Colors.textPrimary },
  handle: { paddingLeft: 16, gap: 3 },
  handleDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.textMuted },
  emptyWrapper: { paddingVertical: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  webControls: { flexDirection: 'row', gap: 4 },
  arrowBtn: { padding: 6 },
  arrow: { fontSize: 12, color: Colors.textSecondary },
  arrowDisabled: { opacity: 0.3 },
})
