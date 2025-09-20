/**
 * WebCrypto utilities for local encryption of sensitive data
 * Used for encrypting diary entries and chat messages before storing in IndexedDB
 */

// Generate a new encryption key
export async function generateEncryptionKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );
}

// Export key to string for storage
export async function exportKey(key: CryptoKey): Promise<string> {
  const exportedKey = await window.crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exportedKey);
}

// Import key from string
export async function importKey(keyString: string): Promise<CryptoKey> {
  const keyData = base64ToArrayBuffer(keyString);
  return await window.crypto.subtle.importKey(
    'raw',
    keyData,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

// Encrypt text
export async function encrypt(text: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Generate a random IV (Initialization Vector)
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    data
  );
  
  // Combine IV and encrypted data
  const result = new Uint8Array(iv.length + encryptedData.byteLength);
  result.set(iv);
  result.set(new Uint8Array(encryptedData), iv.length);
  
  return arrayBufferToBase64(result.buffer);
}

// Decrypt text
export async function decrypt(encryptedText: string, key: CryptoKey): Promise<string> {
  const encryptedData = base64ToArrayBuffer(encryptedText);
  
  // Extract IV from the beginning of the data
  const iv = encryptedData.slice(0, 12);
  const data = encryptedData.slice(12);
  
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

// Helper: Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Initialize encryption for a user
export async function initializeEncryption(): Promise<void> {
  // Check if user already has a key
  if (!localStorage.getItem('encryption-key')) {
    // Generate and store new key
    const key = await generateEncryptionKey();
    const exportedKey = await exportKey(key);
    localStorage.setItem('encryption-key', exportedKey);
  }
}

// Get the user's encryption key
export async function getUserKey(): Promise<CryptoKey> {
  const keyString = localStorage.getItem('encryption-key');
  if (!keyString) {
    // Generate a new key if none exists
    await initializeEncryption();
    return getUserKey();
  }
  
  return importKey(keyString);
}

// Encrypt an object
export async function encryptObject<T extends object>(obj: T): Promise<string> {
  const key = await getUserKey();
  const jsonString = JSON.stringify(obj);
  return encrypt(jsonString, key);
}

// Decrypt an object
export async function decryptObject<T>(encryptedString: string): Promise<T> {
  const key = await getUserKey();
  const jsonString = await decrypt(encryptedString, key);
  return JSON.parse(jsonString) as T;
}
