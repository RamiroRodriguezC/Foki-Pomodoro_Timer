import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { StateStorage } from 'zustand/middleware'

// Adaptador de persistencia unificado para el middleware `persist` de Zustand:
// - Web: `localStorage`
// - Native (iOS/Android): `AsyncStorage`
// Ningún componente ni store debe importar `AsyncStorage` o `localStorage` directamente.

const webStorage: StateStorage = {
  getItem: (name) => {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(name)
  },
  setItem: (name, value) => {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(name, value)
  },
  removeItem: (name) => {
    if (typeof localStorage === 'undefined') return
    localStorage.removeItem(name)
  },
}

const nativeStorage: StateStorage = {
  getItem: (name) => AsyncStorage.getItem(name),
  setItem: (name, value) => AsyncStorage.setItem(name, value),
  removeItem: (name) => AsyncStorage.removeItem(name),
}

export const storage: StateStorage = Platform.OS === 'web' ? webStorage : nativeStorage
