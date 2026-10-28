// Logic for the developer toolkit (components/devtools). Pure functions, all
// running in the browser: nothing is sent anywhere. Randomness comes from
// crypto.getRandomValues, never Math.random.

// --- Random -----------------------------------------------------------------

// A uniform integer in [0, max). Rejection sampling avoids the bias that
// `random % max` would introduce.
export const randomInt = (max: number) => {
  if (max <= 0 || max > 2 ** 32) throw new RangeError('max out of range');
  const limit = 2 ** 32 - (2 ** 32 % max);
  const buffer = new Uint32Array(1);
  while (true) {
    crypto.getRandomValues(buffer);
    if (buffer[0] < limit) return buffer[0] % max;
  }
};

export const randomBytes = (count: number) =>
  crypto.getRandomValues(new Uint8Array(count));

const shuffle = <T>(items: T[]) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const pick = (alphabet: string, count: number) =>
  Array.from({ length: count }, () => alphabet[randomInt(alphabet.length)]);

// --- Passwords --------------------------------------------------------------

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.?/~',
};
// Characters easily misread for one another.
const AMBIGUOUS = /[O0oIl1|]/g;

export type PasswordOptions = {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  avoidAmbiguous: boolean;
};

const passwordSets = (options: PasswordOptions) =>
  (Object.keys(SETS) as (keyof typeof SETS)[])
    .filter((set) => options[set])
    .map((set) =>
      options.avoidAmbiguous ? SETS[set].replace(AMBIGUOUS, '') : SETS[set],
    );

// At least one character from each chosen set, the rest from all of them,
// then shuffled so the guaranteed ones aren't in predictable places.
export const generatePassword = (options: PasswordOptions) => {
  const sets = passwordSets(options);
  if (!sets.length) return '';
  const alphabet = sets.join('');
  const required = sets.map((set) => pick(set, 1)[0]);
  const rest = pick(alphabet, Math.max(0, options.length - required.length));
  return shuffle([...required, ...rest])
    .slice(0, options.length)
    .join('');
};

// Entropy of a password from these options, in bits.
export const passwordEntropy = (options: PasswordOptions) => {
  const size = passwordSets(options).join('').length;
  return size ? options.length * Math.log2(size) : 0;
};

export const strengthLabel = (bits: number) =>
  bits < 40 ? 'Weak' : bits < 64 ? 'Fair' : bits < 100 ? 'Strong' : 'Very strong';

// --- Tokens -----------------------------------------------------------------

export const toHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

const bytesToBinary = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');

export const toBase64 = (bytes: Uint8Array) => btoa(bytesToBinary(bytes));

export const toBase64Url = (bytes: Uint8Array) =>
  toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export type TokenFormat = 'hex' | 'base64url' | 'base64' | 'alphanumeric';

export const generateToken = (format: TokenFormat, bytes: number) => {
  if (format === 'alphanumeric') {
    // As many characters as it takes to carry the same entropy as `bytes`.
    const alphabet = SETS.lower + SETS.upper + SETS.digits;
    return pick(alphabet, Math.ceil((bytes * 8) / Math.log2(alphabet.length))).join(
      '',
    );
  }
  const random = randomBytes(bytes);
  if (format === 'hex') return toHex(random);
  if (format === 'base64') return toBase64(random);
  return toBase64Url(random);
};

export const generateUuid = () => crypto.randomUUID();

// --- Hashes -----------------------------------------------------------------

export type HashAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';

export const hashText = async (text: string, algorithm: HashAlgorithm) =>
  toHex(
    new Uint8Array(
      await crypto.subtle.digest(algorithm, new TextEncoder().encode(text)),
    ),
  );

// --- Encoding ---------------------------------------------------------------

// UTF-8 safe (plain btoa/atob only handle Latin-1).
export const base64Encode = (text: string, urlSafe = false) => {
  const bytes = new TextEncoder().encode(text);
  return urlSafe ? toBase64Url(bytes) : toBase64(bytes);
};

export const base64Decode = (input: string) => {
  const normalised = input.trim().replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalised + '='.repeat((4 - (normalised.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  // Throws on bytes that aren't valid UTF-8 text.
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
};

// --- JWT --------------------------------------------------------------------

export type DecodedJwt = {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  signature: string;
};

// Decodes only; the signature is NOT verified.
export const decodeJwt = (token: string): DecodedJwt => {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error('A JWT has three dot-separated parts.');
  }
  const parse = (part: string, name: string) => {
    try {
      return JSON.parse(base64Decode(part));
    } catch {
      throw new Error(`The ${name} isn't valid Base64url-encoded JSON.`);
    }
  };
  return {
    header: parse(parts[0], 'header'),
    payload: parse(parts[1], 'payload'),
    signature: parts[2],
  };
};

// --- Time -------------------------------------------------------------------

// Numbers above this are treated as milliseconds, below as seconds.
const MS_THRESHOLD = 1e11;

export const parseTimestamp = (input: string): Date | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    const value = Number(trimmed);
    return new Date(Math.abs(value) > MS_THRESHOLD ? value : value * 1000);
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const relativeTime = (date: Date, now = Date.now()) => {
  const seconds = Math.round((date.getTime() - now) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  const format = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size || unit === 'second') {
      return format.format(Math.round(seconds / size), unit);
    }
  }
  return '';
};
