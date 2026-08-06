import { StatusBar } from 'expo-status-bar'
import { ScrollView, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
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

// Alto reservado arriba para no chocar nunca con el Topbar (insets.top + su
// propio padding/contenido), y gap de seguridad abajo contra el borde real
// de la pantalla — mismo criterio que insets.bottom + margen fijo de antes.
const TOP_SAFE_GAP = 76
const BOTTOM_SAFE_GAP = 24

function AppContent() {
  const activePanel = useAppStore((state) => state.activePanel)
  const closePanel = useAppStore((state) => state.closePanel)
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <MeshBackground />

      {/* Dos spacers flex:1 simétricos alrededor del Timer (alto fijo) →
          el dial queda en el centro EXACTO de la pantalla; las tareas
          cuelgan del fondo con el margen de seguridad de paddingBottom.
          El ScrollView es solo red de seguridad: cuando el contenido entra
          (caso normal) no scrollea nada; cuando NO entra en pantallas bajas,
          los spacers colapsan a 0 y la columna completa scrollea en vez de
          recortarse por fuera del viewport. No reemplazar los spacers por
          justifyContent:'center' del contentContainer: eso centra el BLOQUE
          (Timer+tareas) y el dial queda ~160px arriba del centro real. */}
      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[
          styles.mainContent,
          { paddingTop: insets.top + TOP_SAFE_GAP, paddingBottom: insets.bottom + BOTTOM_SAFE_GAP },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.spacer} />
        <Timer />
        <View style={styles.spacer} />
        <TaskList />
      </ScrollView>

      {/* Topbar DESPUÉS del ScrollView: el hit-testing de RN va de arriba
          hacia abajo entre siblings, y un ScrollView a pantalla completa
          renderizado después taparía los botones del header (los toques
          caerían en el scroll, no en los botones). Al ir al final queda por
          encima; su wrapper es absolute con pointerEvents box-none, así que
          solo captura sus propios botones y el resto de la franja sigue
          scrolleando. El paddingTop del contenido ya evita que haya cosas
          interactivas debajo de esta franja. */}
      <Topbar />

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
  mainScroll: {
    flex: 1,
    width: '100%',
  },
  mainContent: {
    flexGrow: 1,
    width: '100%',
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
    width: '100%',
  },
})
