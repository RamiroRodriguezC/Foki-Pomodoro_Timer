import React, { useEffect, useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Colors } from '../../constants/Colors'

interface SheetProps {
  visible: boolean
  onClose: () => void
  children: React.ReactNode
  /** 'bottom': popover/web o bottom sheet/nativo (default). 'left': drawer lateral desde la izquierda. */
  placement?: 'bottom' | 'left'
}

const ANIMATION_DURATION = 250
// Desplazamiento del drawer al salir: cubre un panel de ~min(90%, 400) + margen.
const DRAWER_OFFSET = 420
const isWeb = Platform.OS === 'web'

export function Sheet({ visible, onClose, children, placement = 'bottom' }: SheetProps) {
  const isLeft = placement === 'left'
  const progress = useSharedValue(visible ? 1 : 0)
  // El Modal desmonta el contenido al instante con visible=false, lo que
  // mataría la animación de salida. mounted gatea el desmonte: se mantiene
  // montado mientras withTiming(0) corre y recién se desmonta al terminar.
  const [mounted, setMounted] = useState(visible)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      progress.value = withTiming(1, { duration: ANIMATION_DURATION })
    } else {
      progress.value = withTiming(0, { duration: ANIMATION_DURATION }, (finished) => {
        // El worklet corre en el UI thread (nativo): los setters de React no se
        // pueden llamar directo, se cruza con runOnJS (ver PomodoroLabel).
        if (finished) runOnJS(setMounted)(false)
      })
    }
  }, [visible, progress])

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value }))

  const panelStyle = useAnimatedStyle(() => {
    if (isLeft) {
      return {
        opacity: progress.value,
        transform: [{ translateX: (1 - progress.value) * -DRAWER_OFFSET }],
      }
    }
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
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      {/* GestureHandlerRootView debe ser raíz del Modal: en Android el Modal abre
          una ventana nativa separada y el root de App.tsx no captura gestos ahí.
          Los GestureDetector del drag & drop (SortableTaskList) necesitan este
          root para el drag. */}
      <GestureHandlerRootView style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        <View
          style={[styles.centerWrapper, isLeft ? styles.centerWrapperLeft : styles.centerWrapperBottom]}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              styles.panel,
              isLeft ? styles.panelDrawer : isWeb ? styles.panelWeb : styles.panelNative,
              panelStyle,
            ]}
          >
            {children}
          </Animated.View>
        </View>
      </GestureHandlerRootView>
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
  },
  centerWrapperBottom: {
    justifyContent: isWeb ? 'center' : 'flex-end',
    alignItems: isWeb ? 'center' : 'stretch',
  },
  // Drawer lateral: anclado a la izquierda, altura completa — igual en web y nativo.
  centerWrapperLeft: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
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
  panelDrawer: {
    width: '90%',
    maxWidth: 400,
    height: '100%',
    borderBottomRightRadius: 20,
    borderTopRightRadius: 20,
    borderLeftWidth: 0,
    padding: 20,
    paddingBottom: 32,
  },
})
