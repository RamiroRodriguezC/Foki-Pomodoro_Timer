# AGENTS.md — Foki (Pomodoro + Task Timer)
 
> Fuente de verdad para cualquier agente que trabaje en este repo. Las secciones marcadas **REGLA DURA** no son negociables.
 
---

## 0. Qué es esto
App de foco tipo Pomodoro + gestor de tareas minimalista. Mobile + Web (Expo/React Native). 100% offline, sin cuentas, sin backend. Se diferencia por diseño conductual: baja estimulación visual, un solo modo de uso, sin gamificación, con una capa opcional de audio neuroacústico (gongs, ruido rosa, tono binaural).

## 1. REGLAS DURAS (anti-scope del producto)
 
Estas restricciones son **decisiones de diseño**, no recortes de alcance temporal. No agregar estas features aunque parezcan "mejoras obvias":
 
## 1. REGLAS DURAS — producto
 
1. Sin cuentas, login, ni sincronización en la nube. Cero backend.
2. Sin gamificación: nada de rachas, medallas, puntajes, leaderboards, gráficos de progreso.
3. Sin proyectos/carpetas/etiquetas de tareas. Una única lista global de tareas.
4. Sin menús anidados. Máximo 2 niveles: pantalla principal → panel (settings/sonido/cola).
5. Sin animaciones frenéticas ni segunderos digitales como elemento protagonista — el paso del tiempo se percibe por el dial, el número es secundario.
6. Nunca más de 3 tareas activas visibles en pantalla principal; el resto va a una Cola.
## 2. REGLAS DURAS — arquitectura
 
7. Un único componente `<Sheet>` genérico maneja todos los overlays (popover en web, drawer/bottom sheet en mobile) vía props. Nada de lógica de plataforma repetida por componente.
8. La regla "máx. 3 tareas activas, resto a cola" vive en un solo lugar: un selector derivado en el store. No se recalcula en componentes.
9. IDs con `crypto.randomUUID()` (o equivalente estable), nunca contadores de módulo.
10. Cero dependencias instaladas sin uso real en el código.
11. `expo-audio` para todo el audio (no `expo-av`).
12. El tiempo restante del timer se calcula siempre a partir de un **timestamp absoluto** (ej. `phaseEndsAt = Date.now() + segundosRestantes * 1000`), nunca decrementando un contador en cada tick de `setInterval`. `setInterval` solo se usa para *disparar re-renders* (ej. cada 1s); el valor mostrado sale de restar `Date.now()` a `phaseEndsAt` en cada tick — así el conteo no se atrasa ni se acelera si el tab/app pierde foco y el navegador o el SO throttlea los timers.

---

## 3. Decisiones ya tomadas (para no volver a discutir)
 
| Categoría | Tecnología |
|---|---|
| Framework | React Native (Expo, última SDK estable) |
| Lenguaje | TypeScript, `strict: true` |
| Runtime/Node | Node.js (con loader.js para compatibilidad de type-stripping en node_modules en v24+) |
| Estado | Zustand + middleware `persist` |
| Animación | react-native-reanimated + react-native-worklets |
| Gráficos | react-native-svg (con `LinearGradient`/`Stop` para el dial) |
| Audio | expo-audio |
| Haptics | expo-haptics |
| Gestos | react-native-gesture-handler (drag & drop real de la cola) |
| Persistencia | AsyncStorage (native) / localStorage (web) vía adaptador propio |
| Web | react-native-web |
| Lint/format | ESLint (config RN/Expo) + Prettier, desde el primer commit |
 
---

## 4. Sistema de diseño
 
### 4.1 Dirección estética
Paleta oscura inspirada en Brain.fm: violeta-negro profundo de fondo, gradiente violeta→magenta→rosa como color de marca, acentos cian/verde suave para distinguir fases. Sensación premium/científica, no infantil.
 
### 4.2 Paleta base
```typescript
export const Colors = {
  background: '#0B0A14',
  backgroundElevated: '#141225',
  surface: '#1B1830',
  surfaceLight: '#262143',
 
  gradientStart: '#7B5CFF',
  gradientMid: '#B25CFF',
  gradientEnd: '#FF5CC8',
 
  accentCyan: '#4FE0FF',
  accentGreen: '#4CFFB0',
 
  textBright: '#FFFFFF',
  textPrimary: '#E8E6F5',
  textSecondary: '#9490B5',
  textMuted: '#5C5878',
 
  danger: '#FF5C7A',
  overlay: 'rgba(6, 5, 15, 0.75)',
  border: '#2A2547',
 
  focusFadeOpacity: 0.12,
} as const;
```
Valores de partida: Pueden agregarse nuevos colores o modificarse de ser necesario, incluso a futuro se planea la posibilidad de elegir distintos temas, pero todos prediseñados y aprobados por mi, con bases en la neurociencia.

### 4.3 Dial (componente Clock)
 
Mecánica: un **wedge (porción de pie) sólido que avanza en sentido horario desde las 12**, "comiéndose" el círculo a medida que pasa el tiempo — no es un arco de stroke ni un dial con marcas tipo reloj analógico.
 
- **Círculo base:** disco completo relleno con el color de "tiempo restante" (`backgroundElevated` o un tono apenas más claro que el fondo). Representa el 100% de la fase antes de empezar.
- **Wedge de progreso:** porción de pie sólida que arranca en 0° (12 en punto) y crece en sentido horario a medida que el tiempo transcurre, hasta cubrir el círculo completo al llegar a 00:00. Relleno con el gradiente de marca (`gradientStart → gradientMid → gradientEnd`); en break usa `accentGreen` como color sólido o extremo de gradiente, en longBreak `accentCyan`.
- **Anillo exterior:** aro fino/medio estático (no anima) alrededor de todo el círculo, en el color de acento de la fase activa — es un marco, no participa del progreso.
- **Marcas de referencia (opcional, muy sutil):** como mucho 4 marcas discretas en los puntos cardinales (12/3/6/9), no un dial completo de 60 ticks.
- **Texto central:** `mm:ss`, peso medio, `textBright`, tamaño discreto — secundario respecto al dial, ubicado debajo del círculo (no superpuesto), igual que la referencia visual.
- **Label de fase:** debajo del tiempo, uppercase, letter-spacing amplio, chico.
- **Animación:** el ángulo del wedge se anima con `useSharedValue` + `withTiming` (~950ms de suavizado), cálculo del path del wedge en un worklet (`'worklet'`) para correr en UI thread, no JS thread — igual criterio que un componente SVG con `Path` animado por `useAnimatedProps`.
- **Sin efecto glow ni blur** — el estilo de referencia es plano y sólido, no se busca un efecto de resplandor sobre el wedge.

### 4.4 Tipografía
Sans-serif geométrica limpia (fuente del sistema alcanza para MVP). Jerarquía: label de fase (uppercase, letter-spacing amplio, chico) → tiempo (mediano) → tarea #1 con mayor peso/tamaño que #2/#3.
 
### 4.5 Focus Mode
Al iniciar sesión: fade a `focusFadeOpacity` (0.12) de todo excepto dial + tarea #1, 400ms. Se atenúan: topbar, tareas #2/#3, botones de agregar/cola, acciones de reiniciar/saltar. Al pausar: fade-in a opacidad 1, mismos 400ms.

## 5. Modelos de datos
 
```typescript
// src/types/index.ts
 
export type TimerPhase = 'focus' | 'break' | 'longBreak';
export type SoundBarrier = 'none' | 'pinkNoise' | 'classic' | 'loFi' | 'ambient';
 
export interface SessionConfig {
  focusMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
}
 
export interface SessionRecord {
  timestamp: number;
  phase: TimerPhase;
  durationMinutes: number;
}
 
export interface Task {
  id: string;          // crypto.randomUUID()
  text: string;
  completed: boolean;
  createdAt: number;
  order: number;
}
 
export interface AppSettings {
  config: SessionConfig;
  soundBarrier: SoundBarrier;
  binauralEnabled: boolean;
}
 
export const DEFAULT_SETTINGS: AppSettings = {
  config: { focusMinutes: 25, breakMinutes: 5, longBreakMinutes: 15, sessionsBeforeLongBreak: 4 },
  soundBarrier: 'none',
  binauralEnabled: false,
};
```
 
---
 
## 6. Arquitectura de carpetas
 
```
src/
├── index.ts
├── App.tsx
├── constants/
│   ├── Colors.ts
│   └── SoundLibrary.ts       // tracks de audio: AMBIENT_LIBRARY, MUSIC_LIBRARY, gongs
├── types/
│   └── index.ts
├── stores/
│   ├── useAppStore.ts      // timer, fases, settings, historial, UI panels
│   ├── useTaskStore.ts     // tareas + selectores derivados "activeTasks" (máx 3) / "queuedTasks"
│   └── useAudioStore.ts    // estado efímero de reproducción (no persiste)
├── services/
│   ├── storage.ts
│   └── AudioService.ts     // wrapper imperativo sobre expo-audio (createAudioPlayer)
└── components/
    ├── layout/
    │   ├── Sheet.tsx
    │   └── Topbar.tsx
    ├── audio/
    │   ├── AudioPill.tsx   // píldora superior: selección + play/pause
    │   ├── AudioSheet.tsx  // panel selector: silencio/ambientes/música + volumen
    │   └── audioMeta.tsx   // registry de íconos/labels de tracks y géneros
    ├── timer/
    │   ├── Timer.tsx
    │   ├── Clock.tsx
    │   ├── TimerDisplay.tsx
    │   ├── PomodoroLabel.tsx
    │   └── ResetButton.tsx
    ├── tasks/
    │   ├── TaskList.tsx
    │   ├── TaskItem.tsx
    │   ├── TaskInput.tsx
    │   └── TaskQueue.tsx    // usa <Sheet> + drag & drop
    ├── settings/
    │   ├── SettingsPanel.tsx
    │   ├── SoundPanel.tsx
    │   └── SoundBarrierSelector.tsx
    └── about/
        └── AboutScreen.tsx  // atribución de licencia de audio
```
Por fuera de Src, en la carpeta assets/sounds estaran los sonidos organizados de la siguiente forma:

```
Sounds/
    ├── Gongs/
    │   ├── startGong.mp3
    │   └── finishGong.mp3
    ├── SoundBarrier/
    │   ├── Ambient/     //pistas de sonido ambiente
    │   ├── Classic/     //pistas de musica clasica
    │   ├── Lo-Fi/       //pistas de Lo-Fi
    │   └── PinkNoise.mp3 (pista de Pink Noise brindada por Noise Foundation).
    └── BinauralTone.mp3
```
---
## 7. Requerimientos funcionales
1. Pantalla única, 3 bloques: header de audio → dial central → task sheet.
2. Tap en el dial: sin sesión activa → inicia focus; corriendo → pausa; pausado → resume.
3. Al iniciar focus: gong de inicio + Focus Mode.
4. Al llegar a 00:00: cuenco tibetano, avanza de fase automáticamente (focus→break/longBreak según `sessionsBeforeLongBreak`; break/longBreak→focus).
5. Máximo 3 tareas activas (tarea #1 con jerarquía visual mayor); resto en Cola.
6. Tachar tarea: haptic feedback, animación de tachado, desaparece tras 1.5s, la siguiente asciende.
7. Agregar tarea in-line, sin modal.
8. Reordenar cola con drag & drop real.
9. Promover tarea de cola a activa.
10. Panel de Settings: steppers de duración focus/break/longBreak/sesiones.
11. Panel de Sonido: selector de sound barrier (5 opciones incl. "ninguno") con preview, switch de tono binaural.
12. Pantalla "Acerca de" con atribución de licencia de audio: *"285 Hz Pink Noise by Noise Foundation"* enlazado a `noise-foundation.com`.
13. Persistencia: settings, historial de sesiones y tareas sobreviven al cierre de la app. El estado del timer **también persiste** (fase activa, corriendo/pausado, `phaseEndsAt` si está corriendo o segundos restantes si está pausado) — cerrar la pestaña/app y volver a abrirla debe continuar el conteo real transcurrido, sin perder tiempo ni reiniciar la fase. Ver regla dura #12: esto se logra recalculando contra `Date.now()`, no restaurando un contador congelado.
## 8. Requerimientos no funcionales
 
- 60fps en la animación del dial (cálculos en worklets, no en JS thread).
- Audio en background (`UIBackgroundModes: audio` en iOS; `FOREGROUND_SERVICE`/`WAKE_LOCK` en Android).
- Comportamiento idéntico en web y mobile salvo el tipo de overlay, resuelto por `<Sheet>`.
- **Conteo exacto sin importar foco/background:** cerrar la pestaña del navegador, minimizar la app, bloquear el celular o que el tab pierda foco no debe hacer que el timer se atrase, se acelere ni se reinicie. Al volver a abrir/enfocar, el tiempo mostrado debe reflejar el transcurrido real (ver regla dura #12 y requerimiento funcional #13).
---
 
## 9. Notas de proceso
 
- Confirmar `strict: true` en `tsconfig.json` antes de escribir código.
- Orden de construcción sugerido: `Colors.ts` → `Clock.tsx` → stores → resto de componentes.
- `Sheet` se construye antes que cualquier panel que lo use.
- Ante cualquier decisión no cubierta acá, preguntar antes de asumir — especialmente si toca una regla dura (secciones 1 y 2).