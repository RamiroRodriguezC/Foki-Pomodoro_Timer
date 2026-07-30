import React, { useEffect } from 'react'
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Colors } from '../../constants/Colors'

interface SheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
}

const ANIMATION_DURATION = 250
const isWeb = Platform.OS === 'web'

export function Sheet({ visible, onClose, children }: SheetProps) {
  const progress = useSharedValue(visible ? 1 : 0)

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: ANIMATION_DURATION })
  }, [visible, progress])

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }))

  const panelStyle = useAnimatedStyle(() => {
    if (isWeb) {
      return {
        opacity: progress.value,
        transform: [{ scale: 0.96 + progress.value * 0.04 }],
      }
    }
    return {
      opacity: progress.value,
      transform: [{ translateY: (1 - progress.value) * 400 }],
    }
  })

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <View style={styles.centerWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.panel, isWeb ? styles.panelWeb : styles.panelNative, panelStyle]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
  },
  centerWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: isWeb ? 'center' : 'flex-end',
    alignItems: isWeb ? 'center' : 'stretch',
  },
  panel: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  panelWeb: {
    width: 400,
    maxWidth: '90%',
    borderRadius: 16,
    padding: 20,
  },
  panelNative: {
    width: '100%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
})
