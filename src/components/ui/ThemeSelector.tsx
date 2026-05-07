import React from "react"
import { View, Text, TouchableOpacity, ScrollView } from "react-native"
import { Check } from "lucide-react-native"
import { useThemeStore, type ColorTheme } from "../../store/theme.store"
import { COLOR_THEME_META, THEME_ORDER } from "../../theme/colorThemes"

interface ThemeSelectorProps {
  onThemeSelect?: (theme: ColorTheme) => void
}

function PreviewSwatches({ colors }: { colors: readonly [string, string, string] }) {
  return (
    <View className="flex-row">
      {colors.map((color, i) => (
        <View
          key={i}
          style={{
            backgroundColor: color,
            marginLeft: i === 0 ? 0 : -10,
            width: 28,
            height: 28,
            borderRadius: 14,
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.95)",
          }}
        />
      ))}
    </View>
  )
}

export function ThemeSelector({ onThemeSelect }: ThemeSelectorProps) {
  const { colorTheme, setColorTheme } = useThemeStore()

  function handleSelect(theme: ColorTheme) {
    setColorTheme(theme)
    onThemeSelect?.(theme)
  }

  return (
    <ScrollView
      contentContainerClassName="p-5 pb-10 gap-3"
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-text-secondary dark:text-text-secondary-dark text-[13px] mb-1 leading-5">
        Pick a palette to give the app your own personality. The change applies
        instantly across every screen.
      </Text>

      {THEME_ORDER.map((theme) => {
        const meta = COLOR_THEME_META[theme]
        const active = theme === colorTheme
        return (
          <TouchableOpacity
            key={theme}
            onPress={() => handleSelect(theme)}
            activeOpacity={0.85}
            className={`flex-row items-center gap-4 rounded-2xl border-2 p-4 ${
              active
                ? "border-primary bg-primary-50 dark:bg-primary-900/30"
                : "border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark"
            }`}
          >
            <PreviewSwatches colors={meta.preview} />

            <View className="flex-1">
              <Text
                className={`text-base font-bold ${
                  active
                    ? "text-primary-700 dark:text-primary-300"
                    : "text-text-primary dark:text-text-primary-dark"
                }`}
              >
                {meta.name}
              </Text>
              <Text className="text-text-secondary dark:text-text-secondary-dark text-xs mt-0.5">
                {meta.description}
              </Text>
            </View>

            {active ? (
              <View className="w-7 h-7 rounded-full bg-primary items-center justify-center">
                <Check size={16} color="#fff" strokeWidth={3} />
              </View>
            ) : (
              <View className="w-7 h-7 rounded-full border-2 border-border-light dark:border-border-dark" />
            )}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}
