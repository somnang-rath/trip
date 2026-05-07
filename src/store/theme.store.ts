import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Appearance, type ColorSchemeName } from "react-native"
import { colorScheme as nwColorScheme } from "nativewind"

export type ThemeMode = "light" | "dark" | "system"
export type ColorTheme = "default" | "ocean" | "sunset" | "forest" | "midnight"

interface ThemeState {
  mode: ThemeMode
  colorTheme: ColorTheme
  setMode: (mode: ThemeMode) => void
  setColorTheme: (colorTheme: ColorTheme) => void
  /** Initialize NativeWind's color scheme on app boot. */
  init: () => void
}

function applyMode(mode: ThemeMode) {
  if (mode === "system") {
    const sys: ColorSchemeName = Appearance.getColorScheme()
    nwColorScheme.set(sys === "light" ? "light" : "dark")
  } else {
    nwColorScheme.set(mode)
  }
}

// Color-theme switching is handled by `<ThemeProvider>` via NativeWind's
// `vars()` helper — there is no DOM in React Native, so we just keep the
// chosen theme in state and let the provider re-render with the right
// CSS variable overrides.

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "dark",
      colorTheme: "default",
      setMode: (mode) => {
        applyMode(mode)
        set({ mode })
      },
      setColorTheme: (colorTheme) => set({ colorTheme }),
      init: () => {
        applyMode(get().mode)
      },
    }),
    {
      name: "tripsync.theme",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ mode: s.mode, colorTheme: s.colorTheme }),
      onRehydrateStorage: () => (state) => {
        // Re-apply NativeWind once the persisted mode is restored, otherwise
        // boot defaults to "dark" before rehydration completes.
        if (state) applyMode(state.mode)
      },
    },
  ),
)

// Re-apply when the OS scheme changes and the user has chosen "system"
Appearance.addChangeListener(() => {
  if (useThemeStore.getState().mode === "system") {
    applyMode("system")
  }
})
