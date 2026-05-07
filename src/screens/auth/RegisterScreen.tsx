import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { AuthNavProp } from '../../navigation/types';
import { useRegister } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function RegisterScreen() {
  const navigation = useNavigation<AuthNavProp>();
  const { mutate: register, isPending } = useRegister();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim() || form.name.trim().length < 2) e.name = 'Name must be at least 2 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      e.password = 'Password needs uppercase, lowercase, and a number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleRegister() {
    if (!validate()) return;
    register(
      { name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password },
      { onError: (err: any) => Alert.alert('Registration failed', err?.response?.data?.message ?? 'Please try again') },
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-light dark:bg-bg-dark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="grow justify-center p-6">
        <View className="items-center mb-12">
          <Image
            source={require('../../../assets/img/logo_trip.png')}
            style={{ width: 96, height: 96 }}
            resizeMode="contain"
            className="mb-3 rounded-2xl"
          />
          <Text className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">TripSync</Text>
          <Text className="text-slate-500 dark:text-muted-dark text-base">Create your account</Text>
        </View>

        <View>
          <Input
            label="Full Name"
            value={form.name}
            onChangeText={(v) => set('name', v)}
            placeholder="Jane Doe"
            error={errors.name}
          />
          <Input
            label="Email"
            value={form.email}
            onChangeText={(v) => set('email', v)}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Password"
            value={form.password}
            onChangeText={(v) => set('password', v)}
            placeholder="Min. 8 chars, A-Z, a-z, 0-9"
            secureTextEntry
            error={errors.password}
          />

          <Button title="Create Account" onPress={handleRegister} loading={isPending} />

          <TouchableOpacity className="mt-6 items-center" onPress={() => navigation.navigate('Login')}>
            <Text className="text-slate-500 dark:text-muted-dark text-sm">
              Already have an account?{' '}
              <Text className="text-primary font-semibold">Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
