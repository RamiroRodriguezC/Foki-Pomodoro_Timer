import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AudioPill } from '../audio/AudioPill'

/**
 * Header superior: esquina superior derecha con la AudioPill.
 * En web los insets son 0; en mobile respeta la muesca.
 */
export function Topbar() {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[styles.wrapper, { paddingTop: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <AudioPill />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-end',
    paddingHorizontal: 16,
  },
})
