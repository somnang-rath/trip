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
import { useLogin } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export function LoginScreen() {
  const navigation = useNavigation<AuthNavProp>();
  const { mutate: login, isPending } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    if (!password) e.password = 'Password is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleLogin() {
    if (!validate()) return;
    login(
      { email: email.trim().toLowerCase(), password },
      {
        onError: (err: any) => {
          const status = err?.response?.status;
          const apiMessage = err?.response?.data?.message;
          let title = 'Login failed';
          let message: string;
          if (!err?.response) {
            title = 'Cannot reach server';
            message = `Network request failed.\n\nCheck:\n• Backend is running on port 3000\n• Your device can reach ${process.env.EXPO_PUBLIC_API_URL ?? 'the API URL'}\n• Both are on the same Wi-Fi`;
          } else if (status === 401) {
            message = 'Invalid email or password';
          } else if (Array.isArray(apiMessage)) {
            message = apiMessage.join('\n');
          } else {
            message = apiMessage ?? `Server returned ${status}`;
          }
          Alert.alert(title, message);
        },
      },
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
          <Text className="text-slate-500 dark:text-muted-dark text-base">Plan together. Travel better.</Text>
        </View>

        <View>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.email}
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={errors.password}
          />

          <Button title="Log In" onPress={handleLogin} loading={isPending} />

          <TouchableOpacity className="mt-6 items-center" onPress={() => navigation.navigate('Register')}>
            <Text className="text-slate-500 dark:text-muted-dark text-sm">
              Don't have an account?{' '}
              <Text className="text-primary font-semibold">Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
