import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
import { X, Camera, Image as ImageIcon, Video, Film } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPickPhoto: () => void;
  onPickVideo: () => void;
  onCapturePhoto: () => void;
  onCaptureVideo: () => void;
}

export function AttachmentSheet({
  visible,
  onClose,
  onPickPhoto,
  onPickVideo,
  onCapturePhoto,
  onCaptureVideo,
}: Props) {
  const { colorScheme } = useColorScheme();
  const dark = colorScheme === 'dark';
  const iconColor = dark ? '#e2e8f0' : '#1e293b';

  const items = [
    { key: 'camera-photo', label: 'Take photo', Icon: Camera, onPress: onCapturePhoto },
    { key: 'camera-video', label: 'Record video', Icon: Video, onPress: onCaptureVideo },
    { key: 'lib-photo', label: 'Photo from library', Icon: ImageIcon, onPress: onPickPhoto },
    { key: 'lib-video', label: 'Video from library (15s max)', Icon: Film, onPress: onPickVideo },
  ];

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
        <View className="bg-surface-light dark:bg-surface-dark rounded-t-3xl">
          <View className="items-center py-2">
            <View className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
          </View>
          <View className="px-5 pt-2 pb-6">
            <View className="flex-row items-start justify-between mb-4">
              <View>
                <Text className="text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  Attach
                </Text>
                <Text className="text-slate-900 dark:text-white text-lg font-bold mt-0.5">
                  Send media
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} hitSlop={10} accessibilityLabel="Close">
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {items.map((item, i) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => {
                  onClose();
                  setTimeout(item.onPress, 50);
                }}
                activeOpacity={0.7}
                className={`flex-row items-center py-3.5 ${
                  i === items.length - 1
                    ? ''
                    : 'border-b border-border-light dark:border-border-dark'
                }`}
              >
                <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center mr-3">
                  <item.Icon size={20} color={iconColor} />
                </View>
                <Text className="text-slate-900 dark:text-white text-[15px] flex-1">
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="mt-3 py-3.5 items-center"
            >
              <Text className="text-primary text-[14px] font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
