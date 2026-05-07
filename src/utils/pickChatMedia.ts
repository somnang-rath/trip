import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as VideoThumbnails from 'expo-video-thumbnails';

const IMAGE_MAX_SIDE = 1080;
const IMAGE_QUALITY = 0.6;

const VIDEO_MAX_DURATION_S = 15;

const THUMB_MAX_SIDE = 480;
const THUMB_QUALITY = 0.5;

// 10 MB body limit on the backend; data URL adds ~33% overhead, so cap the
// raw payload at ~7 MB to leave headroom for JSON wrapping and thumbnails.
const MAX_PAYLOAD_BYTES = 7 * 1024 * 1024;

export interface PickedImage {
  type: 'image';
  dataUrl: string;
  width: number;
  height: number;
}

export interface PickedVideo {
  type: 'video';
  dataUrl: string;
  thumbDataUrl: string;
  width: number;
  height: number;
  durationMs: number;
}

export type PickedMedia = PickedImage | PickedVideo;

export class MediaTooLargeError extends Error {
  constructor() {
    super('That clip is too large to send. Try a shorter or lower-quality video.');
  }
}

async function ensurePhotoPermission(): Promise<void> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error(
      'Photo library access was denied. Enable it in Settings to share media.',
    );
  }
}

async function ensureCameraPermission(): Promise<void> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    throw new Error(
      'Camera access was denied. Enable it in Settings to capture media.',
    );
  }
}

function dataUrlByteSize(dataUrl: string): number {
  // base64 is ~4 chars per 3 bytes; close enough for a size check.
  const idx = dataUrl.indexOf('base64,');
  const b64 = idx >= 0 ? dataUrl.slice(idx + 7) : dataUrl;
  return Math.floor((b64.length * 3) / 4);
}

async function compressImage(
  uri: string,
  width: number,
  height: number,
): Promise<{ dataUrl: string; width: number; height: number }> {
  const longSide = Math.max(width, height);
  const scale = longSide > IMAGE_MAX_SIDE ? IMAGE_MAX_SIDE / longSide : 1;
  const targetWidth = Math.round(width * scale);

  const out = await ImageManipulator.manipulateAsync(
    uri,
    scale < 1 ? [{ resize: { width: targetWidth } }] : [],
    {
      compress: IMAGE_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
  if (!out.base64) {
    throw new Error('Failed to encode image. Try a different photo.');
  }
  return {
    dataUrl: `data:image/jpeg;base64,${out.base64}`,
    width: out.width,
    height: out.height,
  };
}

async function buildVideoThumb(uri: string): Promise<string> {
  const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(uri, {
    time: 0,
    quality: 0.7,
  });
  // Re-encode the thumbnail through ImageManipulator so we get a base64 data URL
  // bounded to a reasonable size (the raw thumbnail file URI isn't directly
  // sendable over JSON).
  const out = await ImageManipulator.manipulateAsync(
    thumbUri,
    [{ resize: { width: THUMB_MAX_SIDE } }],
    {
      compress: THUMB_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );
  if (!out.base64) {
    throw new Error('Failed to generate video thumbnail.');
  }
  return `data:image/jpeg;base64,${out.base64}`;
}

async function processImageAsset(
  asset: ImagePicker.ImagePickerAsset,
): Promise<PickedImage> {
  const compressed = await compressImage(asset.uri, asset.width, asset.height);
  if (dataUrlByteSize(compressed.dataUrl) > MAX_PAYLOAD_BYTES) {
    throw new MediaTooLargeError();
  }
  return {
    type: 'image',
    dataUrl: compressed.dataUrl,
    width: compressed.width,
    height: compressed.height,
  };
}

async function processVideoAsset(
  asset: ImagePicker.ImagePickerAsset,
): Promise<PickedVideo> {
  if (!asset.base64) {
    throw new Error('Video could not be read. Try again.');
  }
  // expo-image-picker does not expose the actual MIME type for video assets,
  // but iOS exports as .mov and Android as .mp4 — both render fine via expo-video.
  // Default to mp4 in the data URL so RN treats it as web-friendly.
  const mime = asset.uri.toLowerCase().endsWith('.mov') ? 'video/quicktime' : 'video/mp4';
  const dataUrl = `data:${mime};base64,${asset.base64}`;
  if (dataUrlByteSize(dataUrl) > MAX_PAYLOAD_BYTES) {
    throw new MediaTooLargeError();
  }
  const thumbDataUrl = await buildVideoThumb(asset.uri);
  return {
    type: 'video',
    dataUrl,
    thumbDataUrl,
    width: asset.width,
    height: asset.height,
    durationMs: asset.duration ?? 0,
  };
}

/** Pick a single photo from the library and compress it. */
export async function pickPhotoFromLibrary(): Promise<PickedImage | null> {
  await ensurePhotoPermission();
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return processImageAsset(result.assets[0]);
}

/** Pick a single video from the library, capped at 15 seconds. */
export async function pickVideoFromLibrary(): Promise<PickedVideo | null> {
  await ensurePhotoPermission();
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    allowsEditing: true,
    videoMaxDuration: VIDEO_MAX_DURATION_S,
    quality: 0.5,
    base64: true,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return processVideoAsset(result.assets[0]);
}

/** Open the camera in photo mode. */
export async function captureChatPhoto(): Promise<PickedImage | null> {
  await ensureCameraPermission();
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return processImageAsset(result.assets[0]);
}

/** Open the camera in video mode, capped at 15 seconds. */
export async function captureChatVideo(): Promise<PickedVideo | null> {
  await ensureCameraPermission();
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    videoMaxDuration: VIDEO_MAX_DURATION_S,
    quality: 0.5,
    base64: true,
  });
  if (result.canceled || result.assets.length === 0) return null;
  return processVideoAsset(result.assets[0]);
}
