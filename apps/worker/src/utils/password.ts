const PBKDF2_ITERATIONS = 100_000;
/** Imported hashes may be slightly stronger than current defaults; anything above this is treated as hostile. */
const MAX_PBKDF2_ITERATIONS = 200_000;
const MIN_PBKDF2_ITERATIONS = 10_000;
const PBKDF2_SALT_BYTES = 16;
/** Caps hex decoding so a stored hash cannot force a large allocation on the public password gate. */
const MAX_PBKDF2_HEX_CHARS = 256;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;

export { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH };

/** Constant-time string equality for equal-length secrets. */
export function timingSafeEqualString(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const left = encoder.encode(a);
  const right = encoder.encode(b);
  if (left.length !== right.length) {
    let diff = left.length ^ right.length;
    const longest = left.length > right.length ? left : right;
    for (let i = 0; i < longest.length; i++) {
      diff |= (left[i % left.length] ?? 0) ^ (right[i % right.length] ?? 0);
    }
    return diff === 0 && left.length === right.length;
  }

  let diff = 0;
  for (let i = 0; i < left.length; i++) {
    diff |= left[i]! ^ right[i]!;
  }
  return diff === 0;
}

export async function hashLinkPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const derived = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${bytesToHex(salt)}:${bytesToHex(derived)}`;
}

export async function verifyLinkPassword(stored: string, password: string): Promise<boolean> {
  if (stored.startsWith('pbkdf2:')) {
    const parts = stored.split(':');
    if (parts.length !== 4) return false;
    const iterations = Number(parts[1]);
    const saltHex = parts[2] ?? '';
    const hashHex = parts[3] ?? '';
    if (!isAcceptablePbkdf2Params(iterations, saltHex, hashHex)) return false;
    const salt = hexToBytes(saltHex);
    const expected = hexToBytes(hashHex);
    if (!salt || !expected) return false;
    const actual = await derivePbkdf2(password, salt, iterations);
    return timingSafeEqualBytes(actual, expected);
  }

  const digest = await sha256Hex(password);
  if (stored.startsWith('sha256:')) {
    return timingSafeEqualString(stored.slice('sha256:'.length), digest);
  }
  return timingSafeEqualString(stored, digest);
}

export function validateLinkPasswordInput(
  value: unknown
): { password?: string; error?: string; clear?: boolean } {
  if (value === undefined) return {};
  if (value === null || value === '') return { clear: true };
  if (typeof value !== 'string') return { error: 'password must be a string' };
  const password = value.trim();
  if (!password) return { clear: true };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: `password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return { error: `password must be ${MAX_PASSWORD_LENGTH} characters or less` };
  }
  return { password };
}

/** True when a stored PBKDF2/sha256 hash is safe to persist or verify. */
export function isAcceptableStoredPasswordHash(stored: string): boolean {
  if (stored.startsWith('pbkdf2:')) {
    const parts = stored.split(':');
    if (parts.length !== 4) return false;
    return isAcceptablePbkdf2Params(Number(parts[1]), parts[2] ?? '', parts[3] ?? '');
  }
  if (stored.startsWith('sha256:')) {
    const hex = stored.slice('sha256:'.length);
    return isSha256Hex(hex);
  }
  return isSha256Hex(stored);
}

export function importedPasswordHashError(value: string | null | undefined): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (isAcceptableStoredPasswordHash(value)) return undefined;
  return 'password_hash is not a supported Linketry hash';
}

export function normalizeImportedPasswordHash(value: string | null | undefined): string | null {
  if (!value) return null;
  return isAcceptableStoredPasswordHash(value) ? value : null;
}

function isAcceptablePbkdf2Params(iterations: number, saltHex: string, hashHex: string): boolean {
  return (
    Number.isInteger(iterations) &&
    iterations >= MIN_PBKDF2_ITERATIONS &&
    iterations <= MAX_PBKDF2_ITERATIONS &&
    isHex(saltHex) &&
    isHex(hashHex) &&
    saltHex.length <= MAX_PBKDF2_HEX_CHARS &&
    hashHex.length <= MAX_PBKDF2_HEX_CHARS
  );
}

function isSha256Hex(value: string): boolean {
  return isHex(value) && value.length === 64;
}

function isHex(value: string): boolean {
  return value.length > 0 && value.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(value);
}

async function derivePbkdf2(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return new Uint8Array(bits);
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return bytesToHex(new Uint8Array(digest));
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!;
  }
  return diff === 0;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
