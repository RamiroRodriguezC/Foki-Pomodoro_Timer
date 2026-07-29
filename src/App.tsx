import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import { Colors } from './constants/Colors'

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Foki — Focus Timer</Text>
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
  text: {
    color: Colors.textPrimary,
    fontSize: 20,
  },
})
