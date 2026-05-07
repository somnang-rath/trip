import React, { useEffect } from "react"
import { View } from "react-native"
import { vars } from "nativewind"
import { useThemeStore } from "../store/theme.store"
import { colorThemeVars } from "../theme/colorThemes"

interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * Boots the theme store and injects the active color theme's CSS variable
 * overrides on a root View. NativeWind's runtime cascades those variables to
 * every descendant, so classes like `bg-primary` / `text-primary-700` /
 * `border-primary` switch palette as soon as the user changes themes —
 * without touching the DOM (React Native has none).
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const init = useThemeStore((s) => s.init)
  const colorTheme = useThemeStore((s) => s.colorTheme)

  useEffect(() => {
    init()
  }, [init])

  const themeStyle = vars(colorThemeVars(colorTheme))

  return <View style={[{ flex: 1 }, themeStyle]}>{children}</View>
}
