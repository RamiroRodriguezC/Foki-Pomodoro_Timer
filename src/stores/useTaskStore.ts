import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { storage } from '../services/storage'
import { generateId } from '../utils/id'
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
  reorderTasks: (orderedIds: string[]) => void
  moveTask: (id: string, direction: 'up' | 'down') => void
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
          id: generateId(),
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

      // Reordena la lista COMPLETA (activas + resto). Quién entra a la pantalla
      // principal (máx. 3) y quién es la "tarea actual" se deriva del orden
      // resultante en los selectores — nunca acá (Regla #8).
      reorderTasks: (orderedIds) => {
        set((state) => {
          const tasksById = new Map(state.tasks.map((task) => [task.id, task]))
          const reordered = orderedIds
            .map((id) => tasksById.get(id))
            .filter((task): task is Task => task !== undefined)
          return { tasks: reindex(reordered) }
        })
      },

      moveTask: (id, direction) => {
        set((state) => {
          const sorted = sortByOrder(state.tasks)
          const index = sorted.findIndex((t) => t.id === id)
          if (index === -1) return state

          const swapWith = direction === 'up' ? index - 1 : index + 1
          if (swapWith < 0 || swapWith >= sorted.length) return state

          ;[sorted[index], sorted[swapWith]] = [sorted[swapWith], sorted[index]]
          return { tasks: reindex(sorted) }
        })
      },
    }),
    {
      name: 'foki-task-storage',
      storage: createJSONStorage(() => storage),
    }
  )
)

// Selectores derivados — única fuente de verdad para "máx. 3 activas" y "tarea actual" (Regla dura #8).
export const selectActiveTasks = (state: TaskStoreState): Task[] =>
  sortByOrder(state.tasks).slice(0, MAX_ACTIVE_TASKS)

export const selectAllTasks = (state: TaskStoreState): Task[] => sortByOrder(state.tasks)

export const selectCurrentTask = (state: TaskStoreState): Task | undefined =>
  sortByOrder(state.tasks)[0]