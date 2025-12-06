/**
 * Generates a secure password of the given length.
 * The password is a random sequence of characters from the given charset.
 * @param {number} length The length of the password to generate. Defaults to 12.
 * @returns {string} The generated password.
 */
export function generateSecurePassword(length = 12): string {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (x) => charset[x % charset.length]).join('');
}
