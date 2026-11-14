import * as ImagePicker from 'expo-image-picker';

export type PickPhotoResult =
  | { status: 'picked'; uri: string }
  | { status: 'cancelled' }
  | { status: 'denied' };

/** Ask for photo library access (used by the Photos toggle in Privacy & Data). */
export async function requestPhotoPermission(): Promise<boolean> {
  const result = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return result.granted;
}

/**
 * Let the user choose a square profile photo.
 * The system photo picker doesn't need library permission on current iOS and
 * Android, so we open it directly instead of asking first.
 */
export async function pickProfilePhoto(): Promise<PickPhotoResult> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !result.assets?.length) return { status: 'cancelled' };
    return { status: 'picked', uri: result.assets[0].uri };
  } catch {
    // Older Android versions can still require permission; ask and try once more.
    if (!(await requestPhotoPermission())) return { status: 'denied' };
    const retry = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (retry.canceled || !retry.assets?.length) return { status: 'cancelled' };
    return { status: 'picked', uri: retry.assets[0].uri };
  }
}