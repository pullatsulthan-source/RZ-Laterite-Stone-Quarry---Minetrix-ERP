import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const BILLING_CONFIG_ENC_PREFIX = 'enc:v1:';

const getCrypto = () => {
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || !cryptoObj.subtle) {
    throw new Error('Web Crypto API is not available in this environment.');
  }
  return cryptoObj;
};

const deriveAesKey = async (secret: string): Promise<CryptoKey> => {
  const cryptoObj = getCrypto();
  const encoded = new TextEncoder().encode(secret);
  const hash = await cryptoObj.subtle.digest('SHA-256', encoded);
  return cryptoObj.subtle.importKey('raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
};

const bytesToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
};

const base64ToBytes = (base64: string): Uint8Array => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const encryptForStorage = async (plaintext: string, secret: string): Promise<string> => {
  const cryptoObj = getCrypto();
  const key = await deriveAesKey(secret);
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await cryptoObj.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const cipherBytes = new Uint8Array(cipherBuffer);
  return `${BILLING_CONFIG_ENC_PREFIX}${bytesToBase64(iv)}:${bytesToBase64(cipherBytes)}`;
};

const decryptFromStorage = async (payload: string, secret: string): Promise<string> => {
  if (!payload.startsWith(BILLING_CONFIG_ENC_PREFIX)) {
    return payload;
  }
  const cryptoObj = getCrypto();
  const body = payload.slice(BILLING_CONFIG_ENC_PREFIX.length);
  const [ivB64, cipherB64] = body.split(':');
  if (!ivB64 || !cipherB64) {
    throw new Error('Invalid encrypted payload format.');
  }
  const iv = base64ToBytes(ivB64);
  const cipherBytes = base64ToBytes(cipherB64);
  const buffer = cipherBytes.buffer.slice(
    cipherBytes.byteOffset,
    cipherBytes.byteOffset + cipherBytes.byteLength
  ) as ArrayBuffer;
  const key = await deriveAesKey(secret);
  const plainBuffer = await cryptoObj.subtle.decrypt({ name: 'AES-GCM', iv }, key, buffer);
  return new TextDecoder().decode(plainBuffer);
};
