// src/components/tasks/TaskInput.tsx
import React, { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { Colors } from '../../constants/Colors'
import { useTaskStore } from '../../stores/useTaskStore'

// Agregar tarea in-line, sin modal (FR7).
export function TaskInput() {
  const [text, setText] = useState('')
  const addTask = useTaskStore((state) => state.addTask)

  const handleSubmit = () => {
    if (!text.trim()) return
    addTask(text)
    setText('')
  }

  return (
    <View style={styles.wrapper}>
      <TextInput
        value={text}
        onChangeText={setText}
        onSubmitEditing={handleSubmit}
        placeholder="Agregar tarea"
        placeholderTextColor={Colors.textMuted}
        style={styles.input}
        returnKeyType="done"
        blurOnSubmit={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 320,
    marginTop: 16,
  },
  input: {
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
})