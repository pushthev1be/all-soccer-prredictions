/**
 * Avatar utility for generating consistent user avatars
 * Uses DiceBear Avatars API for free, unique avatars based on user email
 */

export type AvatarStyle = 
  | 'adventurer'
  | 'adventurer-neutral'
  | 'avataaars'
  | 'avataaars-neutral'
  | 'bottts'
  | 'bottts-neutral'
  | 'fun-emoji'
  | 'icons'
  | 'identicon'
  | 'lorelei'
  | 'lorelei-neutral'
  | 'micah'
  | 'miniavs'
  | 'open-peeps'
  | 'personas'
  | 'pixel-art'
  | 'pixel-art-neutral'
  | 'shapes'
  | 'thumbs';

/**
 * Generate avatar URL using DiceBear API
 * @param seed - Unique identifier (usually user email or ID)
 * @param style - Avatar style from DiceBear
 * @returns Avatar URL
 */
export function getAvatarUrl(
  seed: string,
  style: AvatarStyle = 'avataaars-neutral'
): string {
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodedSeed}`;
}

/**
 * Get user avatar with fallback to generated avatar
 * @param user - User object with optional image field
 * @returns Avatar URL (user's image or generated avatar)
 */
export function getUserAvatar(user: {
  email?: string | null;
  image?: string | null;
  id?: string;
}): string {
  // Return user's uploaded image if available
  if (user.image) {
    return user.image;
  }

  // Generate avatar from email or ID
  const seed = user.email || user.id || 'default';
  return getAvatarUrl(seed, 'avataaars-neutral');
}

/**
 * Get initials from user name or email
 * @param user - User object
 * @returns Initials (1-2 characters)
 */
export function getUserInitials(user: {
  name?: string | null;
  email?: string | null;
}): string {
  if (user.name) {
    const parts = user.name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }

  if (user.email) {
    return user.email.substring(0, 2).toUpperCase();
  }

  return 'U';
}

/**
 * Generate a random avatar style for variety
 * @returns Random avatar style
 */
export function getRandomAvatarStyle(): AvatarStyle {
  const styles: AvatarStyle[] = [
    'avataaars-neutral',
    'bottts-neutral',
    'fun-emoji',
    'lorelei-neutral',
    'micah',
    'pixel-art-neutral',
  ];
  return styles[Math.floor(Math.random() * styles.length)];
}
