import { Directory, File, Paths } from 'expo-file-system';

// The image picker returns a file in the cache folder, which the OS can clear.
// Profile photos are copied into the app's document folder so they persist,
// and only that permanent path is saved in user_profile.photo_uri.

const avatarDir = () => new Directory(Paths.document, 'avatars');

/** Copies a picked photo into permanent storage. Returns the new URI (or the original on failure). */
export function persistAvatar(uri: string | null): string | null {
  if (!uri) return null;
  try {
    const dir = avatarDir();
    if (uri.startsWith(dir.uri)) return uri; // already permanent
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    const ext = (uri.split('?')[0].split('.').pop() ?? 'jpg').toLowerCase().slice(0, 5) || 'jpg';
    const dest = new File(dir, `avatar-${Date.now()}.${ext}`);
    new File(uri).copy(dest);
    return dest.uri;
  } catch {
    return uri;
  }
}

/** Deletes a photo we stored earlier. Files outside the avatars folder are never touched. */
export function deleteAvatar(uri: string | null | undefined): void {
  if (!uri) return;
  try {
    if (!uri.startsWith(avatarDir().uri)) return;
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Not worth failing the user's action over a leftover file.
  }
}
