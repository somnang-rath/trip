import React from 'react';
import { View, Text, Image } from 'react-native';

interface Props {
  name: string;
  uri?: string | null;
  size?: number;
}

export function Avatar({ name, uri, size = 40 }: Props) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const circle = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[circle, { resizeMode: 'cover' }]} />;
  }

  return (
    <View className="bg-primary items-center justify-center" style={circle}>
      <Text className="text-white font-bold" style={{ fontSize: size * 0.35 }}>
        {initials}
      </Text>
    </View>
  );
}
