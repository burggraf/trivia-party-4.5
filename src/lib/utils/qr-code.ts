/**
 * QR Code Utility
 *
 * Generates QR codes and join URLs for player onboarding
 */

/**
 * Generates the join URL for a game
 *
 * @param gameCode - 6-character game code
 * @param baseUrl - Base URL of the application (optional, defaults to window.location.origin)
 * @returns Full join URL
 */
export function getJoinUrl(gameCode: string, baseUrl?: string): string {
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  return `${origin}/player/join?code=${gameCode}`
}

/**
 * Generates QR code data URL for a game
 *
 * @param gameCode - 6-character game code
 * @param baseUrl - Base URL of the application (optional)
 * @returns Join URL to be encoded in QR code
 */
export function getQRCodeUrl(gameCode: string, baseUrl?: string): string {
  return getJoinUrl(gameCode, baseUrl)
}

/**
 * Extracts game code from join URL
 *
 * @param url - Join URL
 * @returns Game code or null if not found
 */
export function extractGameCodeFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url)
    return urlObj.searchParams.get('code')
  } catch {
    return null
  }
}
