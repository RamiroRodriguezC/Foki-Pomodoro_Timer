import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { storage } from '../services/storage'
import type { Task } from '../types'

// Máximo de tareas activas visibles en pantalla principal (Regla dura #6).
// Este valor y la lógica derivada viven únicamente acá — nunca se recalculan en componentes (Regla dura #8).
const MAX_ACTIVE_TASKS = 3

interface TaskStoreState {
  tasks: Task[]
}

interface TaskStoreActions {
  addTask: (text: string) => void
  toggleTask: (id: string) => void
  removeTask: (id: string) => void
  reorderQueue: (orderedQueueIds: string[]) => void
  promoteToActive: (id: string) => void
}

export type TaskStore = TaskStoreState & TaskStoreActions

const sortByOrder = (tasks: Task[]): Task[] => [...tasks].sort((a, b) => a.order - b.order)

const reindex = (tasks: Task[]): Task[] => tasks.map((task, index) => ({ ...task, order: index }))

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (text) => {
        const trimmed = text.trim()
        if (!trimmed) return
        const { tasks } = get()
        const newTask: Task = {
          id: crypto.randomUUID(),
          text: trimmed,
          completed: false,
          createdAt: Date.now(),
          order: tasks.length,
        }
        set({ tasks: [...tasks, newTask] })
      },

      toggleTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, completed: !task.completed } : task
          ),
        }))
      },

      removeTask: (id) => {
        set((state) => ({
          tasks: reindex(sortByOrder(state.tasks.filter((task) => task.id !== id))),
        }))
      },

      reorderQueue: (orderedQueueIds) => {
        set((state) => {
          const active = selectActiveTasks(state)
          const activeIds = new Set(active.map((task) => task.id))
          const tasksById = new Map(state.tasks.map((task) => [task.id, task]))

          const reorderedQueue = orderedQueueIds
            .map((id) => tasksById.get(id))
            .filter((task): task is Task => task !== undefined && !activeIds.has(task.id))

          return { tasks: reindex([...active, ...reorderedQueue]) }
        })
      },

      promoteToActive: (id) => {
        set((state) => {
          const sorted = sortByOrder(state.tasks)
          const target = sorted.find((task) => task.id === id)
          if (!target) return state
          const withoutTarget = sorted.filter((task) => task.id !== id)
          const insertIndex = Math.min(MAX_ACTIVE_TASKS - 1, withoutTarget.length)
          withoutTarget.splice(insertIndex, 0, target)
          return { tasks: reindex(withoutTarget) }
        })
      },
    }),
    {
      name: 'foki-task-storage',
      storage: createJSONStorage(() => storage),
    }
  )
)

// Selectores derivados — única fuente de verdad para "máx. 3 activas, resto a cola" (Regla dura #8).
export const selectActiveTasks = (state: TaskStoreState): Task[] =>
  sortByOrder(state.tasks).slice(0, MAX_ACTIVE_TASKS)

export const selectQueuedTasks = (state: TaskStoreState): Task[] =>
  sortByOrder(state.tasks).slice(MAX_ACTIVE_TASKS)
