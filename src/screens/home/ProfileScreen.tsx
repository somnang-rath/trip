import React, { useMemo, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Modal,
  Pressable,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import {
  Sun,
  Moon,
  Smartphone,
  LogOut,
  Plane,
  Users,
  ChevronRight,
  Bell,
  HelpCircle,
  Info,
  Mail,
  Palette,
  Archive,
  UserCircle,
  Pencil,
  KeyRound,
  type LucideIcon,
} from "lucide-react-native"
import { useNavigation } from "@react-navigation/native"
import type { RootNavProp } from "../../navigation/types"
import { useAuthStore } from "../../store/auth.store"
import { useThemeStore, type ThemeMode } from "../../store/theme.store"
import { useLogout } from "../../hooks/useAuth"
import { useMyGroups } from "../../hooks/useGroups"
import { Avatar } from "../../components/ui/Avatar"
import { ThemeSelector } from "../../components/ui/ThemeSelector"

const MODES: { mode: ThemeMode; label: string; Icon: LucideIcon }[] = [
  { mode: "light", label: "Light", Icon: Sun },
  { mode: "dark", label: "Dark", Icon: Moon },
  { mode: "system", label: "Auto", Icon: Smartphone },
]

function StatCard({
  label,
  value,
  Icon,
}: {
  label: string
  value: string | number
  Icon: LucideIcon
}) {
  return (
    <View className="flex-1 bg-surface-light dark:bg-surface-dark rounded-2xl p-4 border border-border-light dark:border-border-dark">
      <View className="flex-row items-center gap-1.5 mb-2">
        <Icon size={14} color="#6366f1" />
        <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
          {label}
        </Text>
      </View>
      <Text className="text-slate-900 dark:text-white text-2xl font-extrabold">
        {value}
      </Text>
    </View>
  )
}

function SectionRow({
  Icon,
  label,
  hint,
  onPress,
  destructive,
  isLast,
}: {
  Icon: LucideIcon
  label: string
  hint?: string
  onPress?: () => void
  destructive?: boolean
  isLast?: boolean
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
      className={`flex-row items-center px-4 py-3.5 ${
        isLast ? "" : "border-b border-border-light dark:border-border-dark"
      }`}
    >
      <View
        className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${
          destructive
            ? "bg-red-100 dark:bg-red-950"
            : "bg-primary-100 dark:bg-primary-900/40"
        }`}
      >
        <Icon size={16} color={destructive ? "#ef4444" : "#6366f1"} />
      </View>
      <View className="flex-1">
        <Text
          className={`text-[15px] font-semibold ${
            destructive ? "text-red-500" : "text-slate-900 dark:text-white"
          }`}
        >
          {label}
        </Text>
        {hint ? (
          <Text className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
            {hint}
          </Text>
        ) : null}
      </View>
      {onPress && !destructive ? (
        <ChevronRight size={16} color="#94a3b8" />
      ) : null}
    </TouchableOpacity>
  )
}

export function ProfileScreen() {
  const navigation = useNavigation<RootNavProp>()
  const user = useAuthStore((s) => s.user)
  const { mode, setMode, colorTheme } = useThemeStore()
  const { mutate: logout } = useLogout()
  const { data: groups } = useMyGroups()
  const [showThemeSelector, setShowThemeSelector] = useState(false)

  const stats = useMemo(() => {
    const list = groups ?? []
    const memberIds = new Set<string>()
    list.forEach((g) => g.members.forEach((m) => memberIds.add(m.user._id)))
    return { trips: list.length, friends: Math.max(0, memberIds.size - 1) }
  }, [groups])

  function handleLogout() {
    Alert.alert("Log out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log out", style: "destructive", onPress: () => logout() },
    ])
  }

  // Render a visible placeholder instead of `return null` so a transient
  // null `user` (e.g., during session restore) doesn't leave the screen
  // looking completely blank.
  if (!user) {
    return (
      <SafeAreaView
        edges={["top"]}
        className="flex-1 bg-bg-light dark:bg-bg-dark items-center justify-center px-6"
      >
        <View className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 items-center justify-center mb-4">
          <UserCircle size={32} color="#6366f1" />
        </View>
        <Text className="text-slate-900 dark:text-white text-lg font-semibold mb-1">
          Loading your profile…
        </Text>
        <Text className="text-slate-500 dark:text-slate-400 text-sm text-center">
          If this stays stuck, sign out and back in to refresh your session.
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-bg-light dark:bg-bg-dark"
    >
      <ScrollView
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-16">
          <View className="h-44 w-full bg-primary relative overflow-hidden">
            {user.coverImage ? (
              <>
                <Image
                  source={{ uri: user.coverImage }}
                  className="absolute inset-0 w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute inset-0 bg-black/25" />
              </>
            ) : (
              <>
                <View className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-white/10" />
                <View className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-white/10" />
                <View className="absolute top-10 left-10 w-24 h-24 rounded-full bg-white/5" />
              </>
            )}
            <View className="absolute top-2 left-0 right-0 px-5 flex-row items-center justify-between">
              <Text className="text-white text-2xl font-extrabold tracking-tight">
                Profile
              </Text>
            </View>
          </View>

          <View className="absolute -bottom-12 left-0 right-0 items-center">
            <View className="rounded-full p-1 bg-surface-light dark:bg-surface-dark">
              <Avatar name={user.name} uri={user.avatar} size={96} />
            </View>
          </View>
        </View>

        <View className="items-center px-5 mb-6">
          <Text className="text-slate-900 dark:text-white text-xl font-extrabold tracking-tight">
            {user.name}
          </Text>
          <View className="flex-row items-center gap-1.5 mt-1">
            <Mail size={12} color="#94a3b8" />
            <Text className="text-slate-500 dark:text-slate-400 text-[13px]">
              {user.email}
            </Text>
          </View>
        </View>

        <View className="px-5 mb-6">
          <View className="flex-row gap-3">
            <StatCard label="Trips" value={stats.trips} Icon={Plane} />
            <StatCard label="Travelers" value={stats.friends} Icon={Users} />
          </View>
        </View>

        <View className="px-5 mb-6">
          <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2 ml-1">
            Account
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl overflow-hidden">
            <SectionRow
              Icon={Pencil}
              label="Edit profile"
              hint="Name, profile picture, cover image"
              onPress={() => navigation.navigate("EditProfile")}
            />
            <SectionRow
              Icon={KeyRound}
              label="Change password"
              hint="Update your account password"
              onPress={() => navigation.navigate("ChangePassword")}
              isLast
            />
          </View>
        </View>

        <View className="px-5 mb-6">
          <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2 ml-1">
            Appearance
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-1.5 flex-row gap-1 mb-4">
            {MODES.map(({ mode: m, label, Icon }) => {
              const active = mode === m
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => setMode(m)}
                  activeOpacity={0.8}
                  className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
                    active ? "bg-primary" : ""
                  }`}
                >
                  <Icon size={14} color={active ? "#fff" : "#6366f1"} />
                  <Text
                    className={`text-[13px] font-semibold ${
                      active
                        ? "text-white"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl overflow-hidden">
            <SectionRow
              Icon={Palette}
              label="Color Theme"
              hint={
                colorTheme === "default"
                  ? "Default"
                  : colorTheme.charAt(0).toUpperCase() + colorTheme.slice(1)
              }
              onPress={() => setShowThemeSelector(true)}
            />
          </View>
        </View>

        <View className="px-5 mb-6">
          <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2 ml-1">
            Preferences
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl overflow-hidden">
            <SectionRow
              Icon={Bell}
              label="Notifications"
              hint="Trip activity, expenses, and chat"
              onPress={() =>
                Alert.alert(
                  "Coming soon",
                  "Notification preferences will land in a future update.",
                )
              }
            />
            <SectionRow
              Icon={Archive}
              label="Archived trips"
              hint="Restore or revisit past trips"
              onPress={() => navigation.navigate("ArchivedTrips")}
            />
            <SectionRow
              Icon={HelpCircle}
              label="Help & Support"
              hint="Guides, FAQ, contact us"
              onPress={() =>
                Alert.alert("Coming soon", "Support center is on the way.")
              }
            />
            <SectionRow
              Icon={Info}
              label="About TripSync"
              hint="Version 1.0.0"
              onPress={() =>
                Alert.alert(
                  "TripSync",
                  "Version 1.0.0\n\nGroup travel made simple.",
                )
              }
              isLast
            />
          </View>
        </View>

        <View className="px-5 mb-2">
          <View className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl overflow-hidden">
            <SectionRow
              Icon={LogOut}
              label="Sign out"
              onPress={handleLogout}
              destructive
              isLast
            />
          </View>
        </View>

        <Text className="text-slate-400 dark:text-slate-600 text-[11px] text-center mt-8">
          TripSync · v1.0.0
        </Text>
      </ScrollView>

      <ThemeSelectorSheet
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </SafeAreaView>
  )
}

function ThemeSelectorSheet({
  visible,
  onClose,
}: {
  visible: boolean
  onClose: () => void
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/60" onPress={onClose} />
        <View
          className="bg-bg-light dark:bg-bg-dark rounded-t-3xl"
          style={{ height: "90%" }}
        >
          <View className="items-center py-2">
            <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </View>
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-border-light dark:border-border-dark">
            <TouchableOpacity onPress={onClose} className="p-2 -ml-2">
              <Text className="text-primary text-base font-semibold">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-text-primary dark:text-text-primary-dark text-lg font-semibold">
              Color Theme
            </Text>
            <View className="w-12" />
          </View>

          <ThemeSelector onThemeSelect={onClose} />
        </View>
      </View>
    </Modal>
  )
}
