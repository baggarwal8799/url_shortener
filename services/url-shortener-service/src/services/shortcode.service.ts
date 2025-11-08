/**
 * Base62 encoding service for generating short codes
 * Uses characters: 0-9, a-z, A-Z (62 characters total)
 */

const BASE62_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Generate a random Base62 short code
 * @param length - Length of the short code (default: 7)
 * @returns Random Base62 string
 */
export const generateShortCode = (length: number = 7): string => {
  let shortCode = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * BASE62_CHARS.length);
    shortCode += BASE62_CHARS[randomIndex];
  }

  return shortCode;
};

/**
 * Encode a number to Base62 string
 * Useful for converting database IDs to short codes
 * @param num - Number to encode
 * @returns Base62 encoded string
 */
export const encodeBase62 = (num: number): string => {
  if (num === 0) return BASE62_CHARS[0];

  let encoded = '';

  while (num > 0) {
    const remainder = num % 62;
    encoded = BASE62_CHARS[remainder] + encoded;
    num = Math.floor(num / 62);
  }

  return encoded;
};

/**
 * Decode a Base62 string to number
 * @param str - Base62 string to decode
 * @returns Decoded number
 */
export const decodeBase62 = (str: string): number => {
  let decoded = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    const charIndex = BASE62_CHARS.indexOf(char);

    if (charIndex === -1) {
      throw new Error(`Invalid Base62 character: ${char}`);
    }

    decoded = decoded * 62 + charIndex;
  }

  return decoded;
};

/**
 * Validate if a string is a valid Base62 code
 * @param code - String to validate
 * @returns true if valid Base62 code
 */
export const isValidShortCode = (code: string): boolean => {
  if (!code || code.length === 0) return false;

  for (const char of code) {
    if (!BASE62_CHARS.includes(char)) {
      return false;
    }
  }

  return true;
};
