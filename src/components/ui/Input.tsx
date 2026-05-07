import React from 'react';
import { TextInput, Text, View, type TextInputProps } from 'react-native';
import { useColorScheme } from 'nativewind';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export function Input({ label, error, containerClassName, ...rest }: Props) {
  const { colorScheme } = useColorScheme();
  const placeholderColor = colorScheme === 'dark' ? '#6b7280' : '#94a3b8';
  return (
    <View className={`mb-4 ${containerClassName ?? ''}`}>
      {label ? (
        <Text className="text-slate-600 dark:text-slate-300 text-sm font-medium mb-1.5">{label}</Text>
      ) : null}
      <TextInput
        className={`bg-white dark:bg-slate-800 border rounded-xl px-4 py-3 text-slate-900 dark:text-white text-base ${
          error
            ? 'border-red-500'
            : 'border-slate-300 dark:border-slate-700'
        }`}
        placeholderTextColor={placeholderColor}
        {...rest}
      />
      {error ? (
        <Text className="text-red-500 dark:text-red-400 text-xs mt-1">{error}</Text>
      ) : null}
    </View>
  );
}
