/**
 * Korean timezone utilities.
 *
 * Provides timezone-aware date/time operations for Korean Standard Time (KST, UTC+9).
 *
 * This module ensures consistent age calculation and datetime operations
 * regardless of the server's system timezone.
 *
 * IMPORTANT: process.env.TZ = 'Asia/Seoul' is set in main.ts to ensure
 * all Date operations use Korean timezone by default.
 */

/**
 * Get current date in Korean timezone.
 *
 * This is critical for accurate age calculation.
 * If the server is in UTC, at 3 AM KST (= 6 PM UTC previous day),
 * new Date() in UTC would return the previous day.
 *
 * @returns Today's date in Korean timezone
 */
export function getTodayKST(): Date {
  // With TZ=Asia/Seoul set, new Date() returns Korean time
  // But for explicit clarity and safety, we use toLocaleString
  const now = new Date();
  const koreaDateStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
  return new Date(koreaDateStr);
}

/**
 * Calculate age based on Korean timezone.
 *
 * Uses Korean date (KST) as reference for accurate age calculation.
 * This is important for legal age verification (만 나이).
 *
 * @param birthDate Date of birth
 * @returns Current age in years (만 나이)
 *
 * @example
 * // If today is 2026-01-12 in Korea
 * calculateKoreanAge(new Date('2012-01-12')) // returns 14 (born on same day)
 * calculateKoreanAge(new Date('2012-01-13')) // returns 13 (born tomorrow)
 */
export function calculateKoreanAge(birthDate: Date): number {
  const today = getTodayKST();
  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  // Check if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
}

/**
 * Check if a person is 14 years old or older based on Korean date.
 *
 * Used for consent requirements:
 * - Under 14: Only guardian consent required
 * - 14 and over: Both guardian and child consent required
 *
 * @param birthDate Date of birth
 * @returns True if the person is 14 years old or older
 */
export function isOver14Korean(birthDate: Date): boolean {
  return calculateKoreanAge(birthDate) >= 14;
}

/**
 * Format date as Korean timezone string.
 *
 * @param date Datetime to format (defaults to current time)
 * @param format Format string
 * @returns Formatted datetime string in KST
 */
export function formatKSTDateTime(date?: Date): string {
  const dt = date || new Date();
  return dt.toLocaleString('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get current datetime in Korean timezone.
 *
 * @returns Current datetime with KST timezone
 */
export function getNowKST(): Date {
  // With TZ=Asia/Seoul set, new Date() should return Korean time
  return new Date();
}
