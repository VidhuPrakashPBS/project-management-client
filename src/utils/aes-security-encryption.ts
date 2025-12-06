import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';

const urlSafeBase64Regex = /=+=$/;

/**
 * Encrypts the given id using AES encryption. The encrypted
 * id is a string.
 *
 * @param id The id to encrypt.
 * @returns The encrypted id as a string.
 */

export function encryptId(id: string | number): string {
  const encrypted = AES.encrypt(
    String(id),
    process.env.NEXT_PUBLIC_AES_SECRET as string
  );
  return encrypted
    .toString()
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(urlSafeBase64Regex, '');
}
/**
 * Decrypts a ciphertext id using AES encryption. The decrypted
 * id is a number.
 *
 * @param ciphertext The ciphertext id to decrypt.
 * @returns The decrypted id as a number.
 */
export function decryptId(ciphertext: string): string | null {
  // Convert URL-safe base64 back to normal base64
  const base64 = ciphertext.replace(/-/g, '+').replace(/_/g, '/');
  const bytes = AES.decrypt(
    base64,
    process.env.NEXT_PUBLIC_AES_SECRET as string
  );
  const decryptedString = bytes.toString(Utf8);
  return decryptedString;
}
