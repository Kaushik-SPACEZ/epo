/**
 * Shared validation utilities for the EcoSudar app.
 * Import from here to keep validation logic consistent across all screens.
 */

/**
 * Validates an email address using a standard RFC-5322-inspired regex.
 * Accepts any valid email (not just @gmail.com).
 */
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

/**
 * Checks if the given string looks like an email address
 * (contains '@') vs a phone number.
 */
export function isEmail(value: string): boolean {
  return value.includes('@');
}

/**
 * Validates a phone number — must be 10 digits (Indian mobile format).
 */
export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.trim());
}
