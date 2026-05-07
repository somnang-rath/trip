import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export type ImageKind = 'avatar' | 'cover';

interface PickResult {
  /** `data:image/jpeg;base64,...` ready to PATCH to the backend. */
  dataUrl: string;
  /** Resized image width × height in pixels. Useful for previews. */
  width: number;
  height: number;
}

/**
 * Open the photo library, let the user pick + crop an image, resize it to a
 * sane max dimension, and return a base64 data URL. Aspect ratio is enforced
 * by `kind`:
 *
 *   • avatar — 1:1 square, max 512 px on the long side, JPEG q=0.7
 *   • cover  — 16:9, max 1080 px on the long side, JPEG q=0.7
 *
 * Returns `null` if the user cancels the picker (NOT an error).
 *
 * Permission is requested lazily on first call — Expo handles the iOS
 * NSPhotoLibraryUsageDescription string defined in app.json.
 */
export async function pickImage(kind: ImageKind): Promise<PickResult | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new Error(
      'Photo library access was denied. Enable it in Settings to choose an image.',
    );
  }

  const aspect: [number, number] = kind === 'avatar' ? [1, 1] : [16, 9];
  const maxSide = kind === 'avatar' ? 512 : 1080;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.85,
  });

  if (result.canceled || result.assets.length === 0) return null;
  const asset = result.assets[0];

  // Compute target so the long side is `maxSide` while preserving aspect.
  const longSide = Math.max(asset.width, asset.height);
  const scale = longSide > maxSide ? maxSide / longSide : 1;
  const targetWidth = Math.round(asset.width * scale);

  const manipulated = await ImageManipulator.manipulateAsync(
    asset.uri,
    scale < 1 ? [{ resize: { width: targetWidth } }] : [],
    {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!manipulated.base64) {
    throw new Error('Failed to encode the image. Try a different photo.');
  }

  return {
    dataUrl: `data:image/jpeg;base64,${manipulated.base64}`,
    width: manipulated.width,
    height: manipulated.height,
  };
}
