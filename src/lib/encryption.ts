import CryptoJS from 'crypto-js';

// WARNING: This key is hardcoded in the source code.
// While it prevents casual snooping of the backup file, it is NOT
// a secure method for protecting highly sensitive data, as anyone
// with access to the source code can decrypt the data.
const SECRET_KEY = 'your-super-secret-key-for-spirit-app';

/**
 * Encrypts a string using AES.
 * @param data The string to encrypt.
 * @returns The encrypted string (Base64 encoded).
 */
export const encryptData = (data: string): string => {
  const ciphertext = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
  return ciphertext;
};

/**
 * Decrypts an AES encrypted string.
 * @param ciphertext The encrypted string (Base64 encoded).
 * @returns The decrypted string, or null if decryption fails.
 */
export const decryptData = (ciphertext: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    // Check if the decrypted content is a non-empty string
    if (originalText) {
      return originalText;
    }
    return null;
  } catch (error) {
    console.error("Decryption error:", error);
    return null;
  }
};
