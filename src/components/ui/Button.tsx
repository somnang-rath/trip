import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native';

interface Props extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}

const containerVariant: Record<string, string> = {
  primary: 'bg-primary active:bg-primary-dark',
  secondary:
    'bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 active:bg-slate-300 dark:active:bg-slate-600',
  danger: 'bg-red-600 active:bg-red-700',
};

const textVariant: Record<string, string> = {
  primary: 'text-white',
  secondary: 'text-slate-800 dark:text-white',
  danger: 'text-white',
};

export function Button({ title, loading, variant = 'primary', disabled, className, ...rest }: Props) {
  const isOff = disabled || loading;
  return (
    <TouchableOpacity
      className={`py-3.5 px-6 rounded-xl items-center justify-center ${containerVariant[variant]} ${isOff ? 'opacity-60' : ''} ${className ?? ''}`}
      disabled={isOff}
      activeOpacity={0.8}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? '#6366f1' : '#fff'} />
      ) : (
        <Text className={`font-semibold text-base ${textVariant[variant]}`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
