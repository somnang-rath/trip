import "./global.css"
import React, { useEffect } from "react"
import { StatusBar } from "expo-status-bar"
import { useColorScheme } from "nativewind"
import { NavigationContainer } from "@react-navigation/native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { RootNavigator } from "./src/navigation/RootNavigator"
import { navigationRef } from "./src/navigation/navigationRef"
import { ThemeProvider } from "./src/components/ThemeProvider"
import { useAuthStore } from "./src/store/auth.store"
import { useSocketStore } from "./src/store/socket.store"
import { getRefreshToken, saveRefreshToken } from "./src/utils/token"
import { registerForPushNotifications } from "./src/utils/pushNotifications"
import { usePushNotificationHandlers } from "./src/hooks/usePushNotificationHandlers"
import { api } from "./src/api/client"
import type { AuthResponse } from "./src/types/auth.types"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function ThemedStatusBar() {
  const { colorScheme } = useColorScheme()
  return <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
}

function AppBootstrap({ children }: { children: React.ReactNode }) {
  const { setAuth, clearAuth } = useAuthStore()
  const { connectChat, connectLocation, connectDm } = useSocketStore()

  // Notification taps deep-link via the navigation ref; foreground arrivals
  // invalidate React Query caches so open screens update instantly.
  usePushNotificationHandlers()

  useEffect(() => {
    async function restoreSession() {
      try {
        const refreshToken = await getRefreshToken()
        if (!refreshToken) return

        const { data } = await api.post<AuthResponse>("/auth/refresh", {
          refreshToken,
        })
        await saveRefreshToken(data.refreshToken)
        setAuth(data.user, data.accessToken)
        connectChat(data.accessToken)
        connectLocation(data.accessToken)
        connectDm(data.accessToken)
        // Re-register the push token for returning users so device changes
        // (new install, OS reinstall, granted permission later) propagate.
        registerForPushNotifications().catch(() => {})
      } catch {
        clearAuth()
      }
    }
    restoreSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <>{children}</>
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <NavigationContainer ref={navigationRef}>
              <AppBootstrap>
                <ThemedStatusBar />
                <RootNavigator />
              </AppBootstrap>
            </NavigationContainer>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
