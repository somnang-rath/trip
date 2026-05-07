import React from 'react';
import { View, TouchableOpacity, Dimensions, Modal } from 'react-native';
import { X } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

interface ImageProps {
  onClose: () => void;
  type: 'image';
  uri: string;
}

interface VideoProps {
  onClose: () => void;
  type: 'video';
  uri: string;
}

type Props = ImageProps | VideoProps;

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

/**
 * Fullscreen viewer for an image or short video. The parent should mount this
 * conditionally (e.g. `{lightboxOpen && <MediaLightbox … />}`) — when it
 * unmounts, the inner `VideoViewer`'s `useVideoPlayer` hook cleans up the
 * native player. This avoids leaking a player per video bubble opened.
 */
export function MediaLightbox(props: Props) {
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={props.onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <TouchableOpacity
          accessibilityLabel="Close"
          onPress={props.onClose}
          hitSlop={12}
          className="absolute top-12 right-5 z-10 w-10 h-10 rounded-full bg-black/55 items-center justify-center"
        >
          <X size={22} color="#fff" />
        </TouchableOpacity>

        {props.type === 'image' ? (
          <ZoomableImage uri={props.uri} />
        ) : (
          <VideoViewer uri={props.uri} />
        )}
      </View>
    </Modal>
  );
}

function ZoomableImage({ uri }: { uri: string }) {
  const { width, height } = Dimensions.get('window');
  const imageHeight = height * 0.85;

  // Committed transform — survives between gestures.
  const baseScale = useSharedValue(1);
  const baseTranslateX = useSharedValue(0);
  const baseTranslateY = useSharedValue(0);
  // Live deltas during an active gesture, applied on top of the committed values.
  const pinchScale = useSharedValue(1);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      pinchScale.value = e.scale;
    })
    .onEnd(() => {
      const next = baseScale.value * pinchScale.value;
      const clamped = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
      baseScale.value = clamped;
      pinchScale.value = 1;
      if (clamped <= MIN_SCALE) {
        baseTranslateX.value = withTiming(0);
        baseTranslateY.value = withTiming(0);
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (baseScale.value <= MIN_SCALE) return;
      panX.value = e.translationX;
      panY.value = e.translationY;
    })
    .onEnd(() => {
      baseTranslateX.value += panX.value;
      baseTranslateY.value += panY.value;
      panX.value = 0;
      panY.value = 0;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (baseScale.value > MIN_SCALE) {
        baseScale.value = withTiming(MIN_SCALE);
        baseTranslateX.value = withTiming(0);
        baseTranslateY.value = withTiming(0);
      } else {
        baseScale.value = withTiming(DOUBLE_TAP_SCALE);
      }
    });

  const composed = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: baseTranslateX.value + panX.value },
      { translateY: baseTranslateY.value + panY.value },
      { scale: baseScale.value * pinchScale.value },
    ],
  }));

  return (
    <View className="flex-1 items-center justify-center">
      <GestureDetector gesture={composed}>
        <Animated.Image
          source={{ uri }}
          style={[{ width, height: imageHeight }, animatedStyle]}
          resizeMode="contain"
        />
      </GestureDetector>
    </View>
  );
}

function VideoViewer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
    p.play();
  });

  const { width, height } = Dimensions.get('window');
  return (
    <View className="flex-1 items-center justify-center">
      <VideoView
        player={player}
        style={{ width, height: height * 0.7 }}
        contentFit="contain"
        allowsFullscreen
        nativeControls
      />
    </View>
  );
}
