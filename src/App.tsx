import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import { Colors } from './constants/Colors'
import { Timer } from './components/timer/Timer'

export default function App() {
  return (
    <View style={styles.container}>
      <Timer />
      <StatusBar style="light" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
