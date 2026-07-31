import React from 'react'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AudioPill } from '../audio/AudioPill'
import { SettingsButton } from '../settings/SettingsButton'

export function Topbar() {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[styles.wrapper, { paddingTop: insets.top + 8 }]}
      pointerEvents="box-none"
    >
      <SettingsButton />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
})