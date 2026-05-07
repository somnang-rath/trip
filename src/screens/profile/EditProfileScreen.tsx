import React, { useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Camera, Trash2 } from "lucide-react-native"
import type { RootNavProp } from "../../navigation/types"
import { useAuthStore } from "../../store/auth.store"
import { useUpdateProfile } from "../../hooks/useUser"
import { Avatar } from "../../components/ui/Avatar"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"
import { pickImage, type ImageKind } from "../../utils/pickImage"

export function EditProfileScreen() {
  const navigation = useNavigation<RootNavProp>()
  const user = useAuthStore((s) => s.user)
  const { mutate: updateProfile, isPending } = useUpdateProfile()

  // Local draft state — only flushed to the server on Save. Tracking which
  // fields the user actually touched lets us PATCH a minimal payload.
  const [name, setName] = useState(user?.name ?? "")
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null)
  const [coverImage, setCoverImage] = useState<string | null>(
    user?.coverImage ?? null,
  )
  const [pickingKind, setPickingKind] = useState<ImageKind | null>(null)

  if (!user) return null

  const trimmedName = name.trim()
  const nameChanged = trimmedName.length > 0 && trimmedName !== user.name
  const avatarChanged = avatar !== (user.avatar ?? null)
  const coverChanged = coverImage !== (user.coverImage ?? null)
  const dirty = nameChanged || avatarChanged || coverChanged

  async function handlePick(kind: ImageKind) {
    try {
      setPickingKind(kind)
      const result = await pickImage(kind)
      if (!result) return
      if (kind === "avatar") setAvatar(result.dataUrl)
      else setCoverImage(result.dataUrl)
    } catch (err: any) {
      Alert.alert("Photo unavailable", err?.message ?? "Could not load photo.")
    } finally {
      setPickingKind(null)
    }
  }

  function handleRemove(kind: ImageKind) {
    if (kind === "avatar") setAvatar(null)
    else setCoverImage(null)
  }

  function handleSave() {
    if (!dirty || !trimmedName) return
    if (trimmedName.length < 2) {
      Alert.alert("Name too short", "Use at least 2 characters.")
      return
    }
    const payload: Record<string, string | null> = {}
    if (nameChanged) payload.name = trimmedName
    if (avatarChanged) payload.avatar = avatar
    if (coverChanged) payload.coverImage = coverImage

    updateProfile(payload, {
      onSuccess: () => navigation.goBack(),
      onError: (err: any) => {
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          "Could not save your changes. Try again."
        Alert.alert("Save failed", String(msg))
      },
    })
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg-light dark:bg-bg-dark"
    >
      <SafeAreaView edges={["bottom"]} className="flex-1">
        <ScrollView
          contentContainerClassName="pb-10"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-16">
            <View className="h-44 w-full bg-primary relative overflow-hidden">
              {coverImage ? (
                <>
                  <Image
                    source={{ uri: coverImage }}
                    className="absolute inset-0 w-full h-full"
                    resizeMode="cover"
                  />
                  <View className="absolute inset-0 bg-black/25" />
                </>
              ) : (
                <>
                  <View className="absolute -top-16 -right-12 w-56 h-56 rounded-full bg-white/10" />
                  <View className="absolute -bottom-20 -left-16 w-64 h-64 rounded-full bg-white/10" />
                </>
              )}

              <View className="absolute bottom-3 right-3 flex-row gap-2">
                {coverImage ? (
                  <TouchableOpacity
                    onPress={() => handleRemove("cover")}
                    activeOpacity={0.85}
                    className="w-10 h-10 rounded-full bg-black/50 items-center justify-center"
                    accessibilityLabel="Remove cover image"
                  >
                    <Trash2 size={16} color="#ffffff" />
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() => handlePick("cover")}
                  disabled={pickingKind !== null}
                  activeOpacity={0.85}
                  className="h-10 px-4 rounded-full bg-black/50 flex-row items-center gap-1.5"
                  accessibilityLabel="Change cover image"
                >
                  {pickingKind === "cover" ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Camera size={14} color="#ffffff" />
                  )}
                  <Text className="text-white text-[13px] font-semibold">
                    {coverImage ? "Change cover" : "Add cover"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="absolute -bottom-12 left-0 right-0 items-center">
              <TouchableOpacity
                onPress={() => handlePick("avatar")}
                disabled={pickingKind !== null}
                activeOpacity={0.85}
              >
                <View className="rounded-full p-1 bg-surface-light dark:bg-surface-dark">
                  <Avatar name={name || user.name} uri={avatar} size={96} />
                </View>
                <View className="absolute bottom-1 right-1 w-9 h-9 rounded-full bg-primary items-center justify-center border-2 border-surface-light dark:border-surface-dark">
                  {pickingKind === "avatar" ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Camera size={15} color="#ffffff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {avatar ? (
            <View className="items-center mt-1 mb-4">
              <TouchableOpacity
                onPress={() => handleRemove("avatar")}
                activeOpacity={0.7}
                className="flex-row items-center gap-1.5 px-3 py-1.5"
              >
                <Trash2 size={12} color="#ef4444" />
                <Text className="text-red-500 text-[12.5px] font-semibold">
                  Remove profile picture
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="mt-1 mb-2" />
          )}

          <View className="px-5 mt-2">
            <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-2 ml-1">
              Profile
            </Text>
            <View className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4">
              <Input
                label="Name"
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                maxLength={50}
                autoCapitalize="words"
                returnKeyType="done"
              />
              <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Email <Text className="text-slate-700 dark:text-slate-300">{user.email}</Text>
                {"  "}can't be changed.
              </Text>
            </View>
          </View>

          <View className="px-5 mt-6 gap-2.5">
            <Button
              title="Save changes"
              onPress={handleSave}
              loading={isPending}
              disabled={!dirty || !trimmedName}
            />
            <Button
              title="Cancel"
              variant="secondary"
              onPress={() => navigation.goBack()}
              disabled={isPending}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}
