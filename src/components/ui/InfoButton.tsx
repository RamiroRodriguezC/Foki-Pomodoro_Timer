import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Feather from '@expo/vector-icons/Feather'
import { Colors } from '../../constants/Colors'

const OVERLAY_OFFSET = 400

/**
 * Botón de información reutilizable: un ícono de "i" discreto que al presionarlo
 * muestra una burbuja de texto asociada (prop `text`).
 *
 * La burbuja aparece debajo del ícono. Cierre:
 * - Tap en el ícono (toggle).
 * - Tap en la burbuja.
 * - Tap en cualquier otro lado de la pantalla (overlay transparente con offsets
 *   negativos que cubre todo el modal; fuera del panel, el tap cae en el
 *   backdrop del Sheet y cierra el sheet).
 */
export function InfoButton({
  text,
  accessibilityLabel = 'Información',
}: {
  text: string
  accessibilityLabel?: string
}) {
  const [open, setOpen] = useState(false)

  const close = () => setOpen(false)

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={styles.iconButton}
        onPress={() => setOpen((v) => !v)}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Feather name="info" size={15} color={Colors.textSecondary} />
      </Pressable>

      {open && (
        <>
          <Pressable style={styles.dismissOverlay} onPress={close} />
          <Pressable style={styles.bubble} onPress={close} accessibilityRole="button">
            <Text style={styles.bubbleText}>{text}</Text>
          </Pressable>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  iconButton: {
    padding: 2,
  },
  dismissOverlay: {
    position: 'absolute',
    top: -OVERLAY_OFFSET,
    bottom: -OVERLAY_OFFSET,
    left: -OVERLAY_OFFSET,
    right: -OVERLAY_OFFSET,
  },
  bubble: {
    position: 'absolute',
    top: 22,
    // Centrada bajo el ícono: (240 - ancho del ícono ≈ 16) / 2
    left: -112,
    width: 240,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 10,
    zIndex: 10,
    elevation: 10,
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textPrimary,
  },
})