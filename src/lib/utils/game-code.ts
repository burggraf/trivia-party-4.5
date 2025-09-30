/**
 * Game Code Utility
 *
 * Generates and validates 6-character game codes for player joining.
 */

/**
 * Generates a random 6-character game code
 *
 * Format: UPPERCASE letters and numbers (excluding confusing characters like O, 0, I, 1)
 * Example: "ABC123", "XY9K4M"
 *
 * @returns 6-character game code
 */
export function generateGameCode(): string {
  // Use characters that are easy to read and type
  // Exclude: O, 0 (zero), I, 1 (one), to avoid confusion
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

  let code = ''
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }

  return code
}

/**
 * Validates a game code format
 *
 * @param code - Game code to validate
 * @returns true if valid format, false otherwise
 */
export function isValidGameCode(code: string): boolean {
  if (!code || code.length !== 6) return false

  // Check if all characters are valid (uppercase letters/numbers, no confusing chars)
  const validChars = /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/
  return validChars.test(code)
}

/**
 * Formats a game code for display (adds separator)
 *
 * @param code - Game code
 * @returns Formatted code (e.g., "ABC-123")
 */
export function formatGameCode(code: string): string {
  if (code.length !== 6) return code
  return `${code.slice(0, 3)}-${code.slice(3)}`
}

/**
 * Normalizes user input to game code format
 *
 * @param input - User input (may have spaces, lowercase, etc.)
 * @returns Normalized game code
 */
export function normalizeGameCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^ABCDEFGHJKLMNPQRSTUVWXYZ23456789]/g, '')
    .slice(0, 6)
}