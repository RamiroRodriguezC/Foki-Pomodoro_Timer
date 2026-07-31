import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { Colors } from './constants/Colors'
import { Timer } from './components/timer/Timer'
import { TaskList } from './components/tasks/TaskList'
import { TaskInput } from './components/tasks/TaskInput'
import { QueueButton } from './components/tasks/QueueButton'
import { TaskQueue } from './components/tasks/TaskQueue'
import { Topbar } from './components/layout/Topbar'
import { AudioSheet } from './components/audio/AudioSheet'
import { Sheet } from './components/layout/Sheet'
import { useAppStore } from './stores/useAppStore'
import { SettingsPanel } from './components/settings/SettingsPanel'

export default function App() {
  const activePanel = useAppStore((state) => state.activePanel)
  const closePanel = useAppStore((state) => state.closePanel)

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <View style={styles.container}>
          <Topbar />
          <Timer />
          <TaskList />
          <TaskInput />
          <QueueButton />
          <Sheet visible={activePanel === 'queue'} onClose={closePanel}>
            <TaskQueue />
          </Sheet>
          <Sheet visible={activePanel === 'sound'} onClose={closePanel}>
            <AudioSheet />
          </Sheet>
          <Sheet visible={activePanel === 'settings'} onClose={closePanel}>
            <SettingsPanel />
          </Sheet>
          <StatusBar style="light" />
        </View>
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
    justifyContent: 'center',
  },
})
