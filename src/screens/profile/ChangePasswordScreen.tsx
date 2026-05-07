import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { Eye, EyeOff, ShieldCheck } from "lucide-react-native"
import type { RootNavProp } from "../../navigation/types"
import { useChangePassword } from "../../hooks/useUser"
import { Input } from "../../components/ui/Input"
import { Button } from "../../components/ui/Button"

interface PasswordFieldProps {
  label: string
  value: string
  onChangeText: (s: string) => void
  placeholder: string
  error?: string
}

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <View className="relative">
      <Input
        label={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        error={error}
      />
      <TouchableOpacity
        onPress={() => setVisible((v) => !v)}
        activeOpacity={0.6}
        className="absolute right-3 top-9 p-1.5"
        accessibilityLabel={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <EyeOff size={18} color="#94a3b8" />
        ) : (
          <Eye size={18} color="#94a3b8" />
        )}
      </TouchableOpacity>
    </View>
  )
}

export function ChangePasswordScreen() {
  const navigation = useNavigation<RootNavProp>()
  const { mutate: changePassword, isPending } = useChangePassword()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState<{
    current?: string
    next?: string
    confirm?: string
  }>({})

  function validate(): boolean {
    const next: typeof errors = {}
    if (!currentPassword) next.current = "Enter your current password"
    if (newPassword.length < 6)
      next.next = "Use at least 6 characters"
    else if (newPassword === currentPassword)
      next.next = "New password must differ from the current one"
    if (confirmPassword !== newPassword)
      next.confirm = "Passwords don't match"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit() {
    if (!validate()) return
    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          Alert.alert(
            "Password changed",
            "Your password was updated. Other devices will need to sign in again.",
            [{ text: "Done", onPress: () => navigation.goBack() }],
          )
        },
        onError: (err: any) => {
          const status = err?.response?.status
          if (status === 401) {
            setErrors({ current: "Current password is incorrect" })
            return
          }
          const msg =
            err?.response?.data?.message ??
            err?.message ??
            "Could not update your password. Try again."
          Alert.alert("Update failed", String(msg))
        },
      },
    )
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg-light dark:bg-bg-dark"
    >
      <SafeAreaView edges={["bottom"]} className="flex-1">
        <ScrollView
          contentContainerClassName="pb-10 px-5"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mt-4 mb-6">
            <View className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/40 items-center justify-center mb-3">
              <ShieldCheck size={28} color="#6366f1" />
            </View>
            <Text className="text-slate-900 dark:text-white text-xl font-extrabold tracking-tight">
              Change your password
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-[13px] mt-1 text-center px-4">
              You'll be signed out everywhere else after this change.
            </Text>
          </View>

          <View className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl p-4">
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChangeText={(s) => {
                setCurrentPassword(s)
                if (errors.current) setErrors((e) => ({ ...e, current: undefined }))
              }}
              placeholder="Enter your current password"
              error={errors.current}
            />
            <PasswordField
              label="New password"
              value={newPassword}
              onChangeText={(s) => {
                setNewPassword(s)
                if (errors.next) setErrors((e) => ({ ...e, next: undefined }))
              }}
              placeholder="At least 6 characters"
              error={errors.next}
            />
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={(s) => {
                setConfirmPassword(s)
                if (errors.confirm) setErrors((e) => ({ ...e, confirm: undefined }))
              }}
              placeholder="Re-enter the new password"
              error={errors.confirm}
            />
          </View>

          <View className="mt-6 gap-2.5">
            <Button
              title="Update password"
              onPress={handleSubmit}
              loading={isPending}
              disabled={!currentPassword || !newPassword || !confirmPassword}
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
