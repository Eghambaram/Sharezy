import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM for ConsentGrant.payloadCipher.
 *
 * Wire format: [version:1][iv:12][tag:16][ciphertext]. The key id is stored
 * alongside (payloadKeyId) so keys can be rotated: decrypt with the key the
 * row names, encrypt with the current one. The grant id is bound as AAD so a
 * ciphertext can't be moved to another grant.
 */
const VERSION = 1;
const IV_LEN = 12;
const TAG_LEN = 16;

export interface CipherKey {
  readonly id: string;
  readonly key: Buffer;
}

export function parseKey(id: string, base64: string): CipherKey {
  const key = Buffer.from(base64, "base64");
  if (key.length !== 32) throw new Error("Encryption key must be 32 bytes");
  return { id, key };
}

export function encryptPayload(value: unknown, key: CipherKey, aad: string): Uint8Array<ArrayBuffer> {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key.key, iv, { authTagLength: TAG_LEN });
  cipher.setAAD(Buffer.from(aad, "utf8"));
  const ct = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  const out = new Uint8Array(new ArrayBuffer(1 + IV_LEN + TAG_LEN + ct.length));
  out.set([VERSION], 0);
  out.set(iv, 1);
  out.set(cipher.getAuthTag(), 1 + IV_LEN);
  out.set(ct, 1 + IV_LEN + TAG_LEN);
  return out;
}

export function decryptPayload(blob: Uint8Array, key: CipherKey, aad: string): unknown {
  const buf = Buffer.from(blob);
  if (buf.length < 1 + IV_LEN + TAG_LEN || buf[0] !== VERSION) throw new Error("Unsupported payload format");
  const iv = buf.subarray(1, 1 + IV_LEN);
  const tag = buf.subarray(1 + IV_LEN, 1 + IV_LEN + TAG_LEN);
  const ct = buf.subarray(1 + IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key.key, iv, { authTagLength: TAG_LEN });
  decipher.setAAD(Buffer.from(aad, "utf8"));
  decipher.setAuthTag(tag);
  const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
  return JSON.parse(pt.toString("utf8")) as unknown;
}
