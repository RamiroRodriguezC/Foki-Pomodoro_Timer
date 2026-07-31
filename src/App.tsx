import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { Colors } from './constants/Colors'
import { Timer } from './components/timer/Timer'
import { TaskList } from './components/tasks/TaskList'
import { TaskInput } from './components/tasks/TaskInput'
import { QueueButton } from './components/tasks/QueueButton'
import { TaskQueue } from './components/tasks/TaskQueue'
import { Sheet } from './components/layout/Sheet'
import { useAppStore } from './stores/useAppStore'

export default function App() {
  const activePanel = useAppStore((state) => state.activePanel)
  const closePanel = useAppStore((state) => state.closePanel)

  return (
    <GestureHandlerRootView style={styles.flex}>
      <View style={styles.container}>
        <Timer />
        <TaskList />
        <TaskInput />
        <QueueButton />
        <Sheet visible={activePanel === 'queue'} onClose={closePanel}>
          <TaskQueue />
        </Sheet>
        <StatusBar style="light" />
      </View>
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
