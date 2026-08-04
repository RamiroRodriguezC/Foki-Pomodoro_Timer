import { StatusBar } from 'expo-status-bar'
import { ScrollView, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Colors } from './constants/Colors'
import { Timer } from './components/timer/Timer'
import { TaskList } from './components/tasks/TaskList'
import { TaskDrawer } from './components/tasks/TaskDrawer'
import { Topbar } from './components/layout/Topbar'
import { MeshBackground } from './components/layout/MeshBackground'
import { AudioSheet } from './components/audio/AudioSheet'
import { Sheet } from './components/layout/Sheet'
import { useAppStore } from './stores/useAppStore'
import { SettingsPanel } from './components/settings/SettingsPanel'

function AppContent() {
  const activePanel = useAppStore((state) => state.activePanel)
  const closePanel = useAppStore((state) => state.closePanel)

  return (
    <View style={styles.container}>
      <MeshBackground />
      <Topbar />

      {/* topSpacer y bottomZone comparten el MISMO flex (1) → siempre miden
          lo mismo entre sí. Eso es lo que centra al Timer en el medio REAL
          de la pantalla (no aproximado) y, de paso, fija el alto de
          bottomZone independientemente de cuántas tareas haya — solo cambia
          si el propio Timer cambia de alto (ej. aparece el ResetButton al
          pausar, que ya se comportaba así antes de tocar este archivo).
          No reemplazar por valores fijos ni position:absolute — ya se
          probaron y generan overlap o desalineación. */}
      <View style={styles.topSpacer} pointerEvents="none" />

      <Timer />

      <View style={styles.bottomZone}>
        {/* Solo la lista de tareas activas scrollea (máx. 3). El resto de la
            gestión (agregar, reordenar, eliminar) vive en el drawer izquierdo. */}
        <ScrollView
          style={styles.bottomScroll}
          contentContainerStyle={styles.bottomContent}
          showsVerticalScrollIndicator={false}
        >
          <TaskList />
        </ScrollView>
      </View>

      <Sheet visible={activePanel === 'tasks'} onClose={closePanel} placement="left">
        <TaskDrawer />
      </Sheet>
      <Sheet visible={activePanel === 'sound'} onClose={closePanel}>
        <AudioSheet />
      </Sheet>
      <Sheet visible={activePanel === 'settings'} onClose={closePanel}>
        <SettingsPanel />
      </Sheet>
      <StatusBar style="light" />
    </View>
  )
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  topSpacer: {
    flex: 1,
    width: '100%',
  },
  bottomZone: {
    flex: 1,
    width: '100%',
  },
  bottomScroll: {
    flex: 1,
    width: '100%',
    minHeight: 0,
  },
  bottomContent: {
    alignItems: 'center',
  },
})