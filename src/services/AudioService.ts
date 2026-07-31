import { createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import type { AudioPlayer } from 'expo-audio'

/**
 * Wrapper imperativo sobre expo-audio.
 * Mismo criterio que storage.ts: centraliza el acceso a la librería de audio
 * para no llamarla directamente desde componentes ni stores.
 */
class AudioServiceImpl {
  private player: AudioPlayer | null = null
  private oneShotPlayer: AudioPlayer | null = null
  private currentVolume = 0.6
  private fadeInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initAudioMode()
  }

  private async initAudioMode() {
    try {
      // Configurar audio para background playback y permitir reproducción con el mute switch del hardware
      await setAudioModeAsync({
        playsInSilentMode: true, // Reproduce aunque el iPhone esté en modo silencio
        shouldPlayInBackground: true, // Permite reproducción en background
        interruptionMode: 'duckOthers', // Baja el volumen de otras apps, no las pausa
      })
    } catch (error) {
      console.error('Failed to set audio mode:', error)
    }
  }

  /**
   * Carga y reproduce un track de fondo en loop. Si ya hay algo sonando,
   * lo reemplaza (sin crossfade entre tracks — el fade es solo in/out global).
   */
  async playTrack(fileModule: number, options?: { loop?: boolean }): Promise<void> {
    try {
      // Si ya hay un player activo, detenerlo y liberarlo
      if (this.player) {
        this.player.pause()
        this.player.remove()
      }

      // Crear nuevo player (updateInterval: 500ms, keepAudioSessionActive: false)
      this.player = createAudioPlayer(fileModule, {
        updateInterval: 500,
        keepAudioSessionActive: false,
      })

      // Configurar loop (por defecto true para tracks de fondo)
      this.player.loop = options?.loop ?? true

      // Setear volumen actual
      this.player.volume = this.currentVolume

      // Reproducir
      this.player.play()
    } catch (error) {
      console.error('Failed to play track:', error)
      throw error
    }
  }

  async pause(): Promise<void> {
    if (this.player) {
      this.player.pause()
    }
  }

  async resume(): Promise<void> {
    if (this.player) {
      this.player.play()
    }
  }

  async stop(): Promise<void> {
    if (this.player) {
      this.player.pause()
      this.player.remove()
      this.player = null
    }
    // Cancelar cualquier fade en progreso
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval)
      this.fadeInterval = null
    }
  }

  setVolume(volume: number): void {
    // Clamp entre 0 y 1
    this.currentVolume = Math.max(0, Math.min(1, volume))
    if (this.player) {
      this.player.volume = this.currentVolume
    }
  }

  /**
   * Fade lineal simple con setInterval (no Reanimated — el volumen del audio
   * no se renderiza en UI thread, un tween en JS alcanza). durationMs según
   * el diseño: 1500ms in/out normal, 1000ms en pausa manual.
   *
   * Requisito: debe poder cancelarse a mitad de camino (si se dispara un fade-out
   * mientras un fade-in está corriendo, cancelar el interval anterior antes de
   * arrancar el nuevo — nunca deben correr dos fades en simultáneo peleando por
   * el mismo volumen).
   */
  async fadeTo(targetVolume: number, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.player) {
        resolve()
        return
      }

      // Cancelar cualquier fade en progreso
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval)
        this.fadeInterval = null
      }

      const startVolume = this.player.volume
      const volumeDelta = targetVolume - startVolume
      const startTime = Date.now()

      this.fadeInterval = setInterval(() => {
        if (!this.player) {
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval)
            this.fadeInterval = null
          }
          resolve()
          return
        }

        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / durationMs, 1)

        // Interpolación lineal
        const newVolume = startVolume + volumeDelta * progress
        this.player.volume = Math.max(0, Math.min(1, newVolume))

        if (progress >= 1) {
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval)
            this.fadeInterval = null
          }
          // Actualizar el volumen interno para que setVolume() use este valor
          this.currentVolume = targetVolume
          resolve()
        }
      }, 16) // ~60fps
    })
  }

  /**
   * Sonidos one-shot, no loop, no afectan el volumen del track de fondo.
   */
  async playOneShot(fileModule: number): Promise<void> {
    try {
      // Si ya hay un one-shot player activo, liberarlo
      if (this.oneShotPlayer) {
        this.oneShotPlayer.remove()
      }

      // Crear nuevo player para one-shot (updateInterval: 500ms, keepAudioSessionActive: true para no interrumpir el track de fondo)
      this.oneShotPlayer = createAudioPlayer(fileModule, {
        updateInterval: 500,
        keepAudioSessionActive: true,
      })

      // No loop
      this.oneShotPlayer.loop = false

      // Volumen completo (los gongs/cuencos no respetan el slider de volumen del usuario)
      this.oneShotPlayer.volume = 1.0

      // Reproducir
      this.oneShotPlayer.play()

      // Liberar automáticamente cuando termine (aproximadamente después de la duración esperada)
      // Los gongs/cuencos son cortos (~3-5 segundos), usar un timeout generoso
      setTimeout(() => {
        if (this.oneShotPlayer) {
          this.oneShotPlayer.remove()
          this.oneShotPlayer = null
        }
      }, 10000) // 10 segundos de margen
    } catch (error) {
      console.error('Failed to play one-shot sound:', error)
      throw error
    }
  }
}

// Singleton exportado
export const AudioService = new AudioServiceImpl()
