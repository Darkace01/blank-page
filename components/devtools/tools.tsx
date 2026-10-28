'use client';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import {
  BrutalButton,
  BrutalRow,
  BrutalSlider,
  BrutalSwitch,
  brutalSelectContent,
  brutalSelectItem,
  brutalSelectTrigger,
} from '@/components/brutal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  base64Decode,
  base64Encode,
  type DecodedJwt,
  decodeJwt,
  generatePassword,
  generateToken,
  generateUuid,
  type HashAlgorithm,
  hashText,
  type PasswordOptions,
  parseTimestamp,
  passwordEntropy,
  relativeTime,
  strengthLabel,
  type TokenFormat,
} from '@/lib/devtools';
import { cn } from '@/lib/utils';

// --- Shared pieces ------------------------------------------------------------

const field =
  'w-full border-2 border-brutal-line bg-brutal-paper p-2 font-mono text-sm text-brutal-text shadow-[2px_2px_0_0_rgb(var(--brutal-shadow))] placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';

function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);
  return (
    <BrutalButton
      disabled={!value}
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
      }}
    >
      {copied ? <Check /> : <Copy />} {copied ? 'Copied' : label}
    </BrutalButton>
  );
}

// A read-only value with a copy button.
function Output({ value, rows = 1 }: { value: string; rows?: number }) {
  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-start'>
      {rows > 1 ? (
        <textarea
          readOnly
          value={value}
          rows={rows}
          className={cn(field, 'resize-none break-all')}
          aria-label='Result'
        />
      ) : (
        <input readOnly value={value} className={field} aria-label='Result' />
      )}
      <CopyButton value={value} />
    </div>
  );
}

function ErrorText({ children }: { children: ReactNode }) {
  return (
    <p className='border-2 border-brutal-line bg-rose-200 px-3 py-2 text-sm text-black' role='alert'>
      {children}
    </p>
  );
}

function ToolSelect<T extends string>({
  id,
  value,
  onValueChange,
  options,
}: {
  id: string;
  value: T;
  onValueChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as T)}>
      <SelectTrigger id={id} className={cn(brutalSelectTrigger, 'w-40')}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className={brutalSelectContent}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} className={brutalSelectItem}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Two modes (e.g. encode/decode) as pressed/unpressed buttons.
function ModeToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  return (
    <div className='flex gap-3'>
      {options.map((option) => (
        <BrutalButton
          key={option.value}
          variant={value === option.value ? 'active' : 'light'}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </BrutalButton>
      ))}
    </div>
  );
}

// --- Password -----------------------------------------------------------------

export function PasswordTool() {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 20,
    lower: true,
    upper: true,
    digits: true,
    symbols: true,
    avoidAmbiguous: false,
  });
  const [password, setPassword] = useState('');
  const regenerate = useCallback(() => setPassword(generatePassword(options)), [options]);
  useEffect(regenerate, [regenerate]);

  const bits = passwordEntropy(options);
  const toggles: [keyof PasswordOptions, string][] = [
    ['lower', 'Lowercase (a-z)'],
    ['upper', 'Uppercase (A-Z)'],
    ['digits', 'Numbers (0-9)'],
    ['symbols', 'Symbols (!@#…)'],
    ['avoidAmbiguous', 'Avoid look-alikes (O 0 l 1)'],
  ];

  return (
    <div className='space-y-5'>
      <Output value={password} />
      <div className='flex flex-wrap items-center gap-3'>
        <BrutalButton variant='primary' onClick={regenerate}>
          <RefreshCw /> Generate
        </BrutalButton>
        <span className='border-2 border-brutal-line bg-brutal-paper px-2 py-1 text-xs font-semibold uppercase tracking-wider'>
          {strengthLabel(bits)} · {Math.round(bits)} bits
        </span>
      </div>
      <div className='space-y-2'>
        <div className='flex justify-between text-sm font-medium'>
          <span>Length</span>
          <span className='tabular-nums'>{options.length}</span>
        </div>
        <BrutalSlider
          min={6}
          max={64}
          step={1}
          value={[options.length]}
          onValueChange={([length]) => setOptions((o) => ({ ...o, length }))}
          aria-label='Password length'
        />
      </div>
      <div className='space-y-3'>
        {toggles.map(([key, label]) => (
          <BrutalRow key={key} htmlFor={`pw-${key}`} label={label}>
            <BrutalSwitch
              id={`pw-${key}`}
              checked={options[key] as boolean}
              onCheckedChange={(on) => setOptions((o) => ({ ...o, [key]: on }))}
            />
          </BrutalRow>
        ))}
      </div>
    </div>
  );
}

// --- Tokens and UUIDs -------------------------------------------------------------

const TOKEN_FORMATS = [
  { value: 'hex', label: 'Hex' },
  { value: 'base64url', label: 'Base64url' },
  { value: 'base64', label: 'Base64' },
  { value: 'alphanumeric', label: 'Alphanumeric' },
] as const;

const TOKEN_BYTES = [16, 24, 32, 48, 64].map((bytes) => ({
  value: String(bytes),
  label: `${bytes} bytes (${bytes * 8} bits)`,
}));

export function TokenTool() {
  const [format, setFormat] = useState<TokenFormat>('base64url');
  const [bytes, setBytes] = useState('32');
  const [prefix, setPrefix] = useState('');
  const [token, setToken] = useState('');
  const regenerate = useCallback(
    () => setToken(prefix + generateToken(format, Number(bytes))),
    [format, bytes, prefix],
  );
  useEffect(regenerate, [regenerate]);

  return (
    <div className='space-y-5'>
      <Output value={token} rows={2} />
      <BrutalButton variant='primary' onClick={regenerate}>
        <RefreshCw /> Generate
      </BrutalButton>
      <BrutalRow htmlFor='token-format' label='Format'>
        <ToolSelect<TokenFormat>
          id='token-format'
          value={format}
          onValueChange={setFormat}
          options={TOKEN_FORMATS}
        />
      </BrutalRow>
      <BrutalRow htmlFor='token-bytes' label='Strength'>
        <ToolSelect id='token-bytes' value={bytes} onValueChange={setBytes} options={TOKEN_BYTES} />
      </BrutalRow>
      <div className='space-y-2'>
        <label htmlFor='token-prefix' className='text-sm font-medium'>
          Prefix <span className='text-brutal-muted'>(optional, e.g. sk_live_)</span>
        </label>
        <input
          id='token-prefix'
          value={prefix}
          onChange={(e) => setPrefix(e.target.value)}
          placeholder='key_'
          className={field}
        />
      </div>
    </div>
  );
}

export function UuidTool() {
  const [count, setCount] = useState('5');
  const [uppercase, setUppercase] = useState(false);
  const [uuids, setUuids] = useState('');
  const regenerate = useCallback(() => {
    const list = Array.from({ length: Number(count) }, generateUuid).join('\n');
    setUuids(uppercase ? list.toUpperCase() : list);
  }, [count, uppercase]);
  useEffect(regenerate, [regenerate]);

  return (
    <div className='space-y-5'>
      <Output value={uuids} rows={Math.min(Number(count), 10)} />
      <BrutalButton variant='primary' onClick={regenerate}>
        <RefreshCw /> Generate
      </BrutalButton>
      <BrutalRow htmlFor='uuid-count' label='How many'>
        <ToolSelect
          id='uuid-count'
          value={count}
          onValueChange={setCount}
          options={['1', '5', '10', '25', '50'].map((n) => ({ value: n, label: n }))}
        />
      </BrutalRow>
      <BrutalRow htmlFor='uuid-upper' label='Uppercase'>
        <BrutalSwitch id='uuid-upper' checked={uppercase} onCheckedChange={setUppercase} />
      </BrutalRow>
    </div>
  );
}

// --- Hash ---------------------------------------------------------------------

const HASHES = ['SHA-256', 'SHA-384', 'SHA-512', 'SHA-1'] as const;

export function HashTool() {
  const [text, setText] = useState('');
  const [hashes, setHashes] = useState<Partial<Record<HashAlgorithm, string>>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(HASHES.map((algorithm) => hashText(text, algorithm))).then((results) => {
      if (!cancelled) {
        setHashes(Object.fromEntries(HASHES.map((algorithm, i) => [algorithm, results[i]])));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <div className='space-y-5'>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder='Text to hash'
        className={field}
        aria-label='Text to hash'
      />
      {HASHES.map((algorithm) => (
        <div key={algorithm} className='space-y-1'>
          <div className='text-xs font-semibold uppercase tracking-wider text-brutal-accent'>
            {algorithm}
            {algorithm === 'SHA-1' && (
              <span className='ml-2 normal-case text-brutal-muted'>(legacy, not for security)</span>
            )}
          </div>
          <Output value={hashes[algorithm] ?? ''} rows={algorithm === 'SHA-256' ? 1 : 2} />
        </div>
      ))}
    </div>
  );
}

// --- Base64 and URL encoding -------------------------------------------------------

type Direction = 'encode' | 'decode';
const DIRECTIONS = [
  { value: 'encode', label: 'Encode' },
  { value: 'decode', label: 'Decode' },
] as const;

function EncoderTool({
  encode,
  decode,
  extra,
  placeholder,
}: {
  encode: (input: string) => string;
  decode: (input: string) => string;
  extra?: ReactNode;
  placeholder: string;
}) {
  const [direction, setDirection] = useState<Direction>('encode');
  const [input, setInput] = useState('');
  let output = '';
  let error = '';
  try {
    output = input ? (direction === 'encode' ? encode(input) : decode(input)) : '';
  } catch {
    error =
      direction === 'decode'
        ? "That input can't be decoded."
        : "That input can't be encoded.";
  }

  return (
    <div className='space-y-5'>
      <div className='flex flex-wrap items-center gap-4'>
        <ModeToggle<Direction>
          value={direction}
          onChange={setDirection}
          options={DIRECTIONS}
        />
        {extra}
      </div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={5}
        placeholder={direction === 'encode' ? placeholder : 'Encoded text to decode'}
        className={field}
        aria-label='Input'
      />
      {error ? <ErrorText>{error}</ErrorText> : <Output value={output} rows={5} />}
    </div>
  );
}

export function Base64Tool() {
  const [urlSafe, setUrlSafe] = useState(false);
  return (
    <EncoderTool
      encode={(input) => base64Encode(input, urlSafe)}
      decode={base64Decode}
      placeholder='Text to encode (any language or emoji)'
      extra={
        <div className='flex items-center gap-2'>
          <BrutalSwitch id='base64-url-safe' checked={urlSafe} onCheckedChange={setUrlSafe} />
          <label htmlFor='base64-url-safe' className='text-sm font-medium'>
            URL-safe
          </label>
        </div>
      }
    />
  );
}

export function UrlTool() {
  return (
    <EncoderTool
      encode={encodeURIComponent}
      decode={decodeURIComponent}
      placeholder='Text or query value to encode'
    />
  );
}

// --- JWT ----------------------------------------------------------------------

const TIME_CLAIMS = ['exp', 'iat', 'nbf'];

export function JwtTool() {
  const [token, setToken] = useState('');
  let decoded: DecodedJwt | null = null;
  let error = '';
  if (token.trim()) {
    try {
      decoded = decodeJwt(token);
    } catch (e) {
      error = (e as Error).message;
    }
  }
  const payload = decoded?.payload ?? {};
  const exp = payload.exp;
  const expired = typeof exp === 'number' && exp * 1000 < Date.now();
  const timeClaims = TIME_CLAIMS.filter((claim) => typeof payload[claim] === 'number');

  return (
    <div className='space-y-5'>
      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        rows={4}
        placeholder='Paste a JWT (eyJ...)'
        className={cn(field, 'break-all')}
        aria-label='JWT'
      />
      <p className='text-xs text-brutal-muted'>
        Decoded locally, and the signature is <strong>not</strong> verified.
      </p>
      {error && <ErrorText>{error}</ErrorText>}
      {decoded && (
        <>
          {typeof exp === 'number' && (
            <span
              className={cn(
                'inline-block border-2 border-brutal-line px-2 py-1 text-xs font-semibold uppercase tracking-wider',
                expired ? 'bg-rose-300 text-black' : 'bg-emerald-300 text-black',
              )}
            >
              {expired ? 'Expired' : 'Valid until'} {new Date(exp * 1000).toLocaleString()}
            </span>
          )}
          {(
            [
              ['header', decoded.header],
              ['payload', decoded.payload],
            ] as const
          ).map(([part, value]) => (
            <div key={part} className='space-y-1'>
              <div className='text-xs font-semibold uppercase tracking-wider text-brutal-accent'>
                {part}
              </div>
              <pre className={cn(field, 'overflow-x-auto whitespace-pre')}>
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          ))}
          {timeClaims.length > 0 && (
            <ul className='space-y-1 text-sm'>
              {timeClaims.map((claim) => {
                const date = new Date((payload[claim] as number) * 1000);
                return (
                  <li key={claim}>
                    <span className='font-mono font-semibold'>{claim}</span>:{' '}
                    {date.toLocaleString()} ({relativeTime(date)})
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

// --- JSON ---------------------------------------------------------------------

export function JsonTool() {
  const [input, setInput] = useState('');
  const [indent, setIndent] = useState<'2' | '4' | 'min'>('2');
  let output = '';
  let error = '';
  if (input.trim()) {
    try {
      const parsed = JSON.parse(input);
      output = indent === 'min' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, Number(indent));
    } catch (e) {
      error = (e as Error).message;
    }
  }

  return (
    <div className='space-y-5'>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={6}
        placeholder='{"paste": "JSON here"}'
        className={field}
        aria-label='JSON input'
      />
      <ModeToggle<'2' | '4' | 'min'>
        value={indent}
        onChange={setIndent}
        options={[
          { value: '2', label: '2 spaces' },
          { value: '4', label: '4 spaces' },
          { value: 'min', label: 'Minify' },
        ]}
      />
      {error ? (
        <ErrorText>Invalid JSON: {error}</ErrorText>
      ) : (
        output && (
          <span className='inline-block border-2 border-brutal-line bg-emerald-300 px-2 py-1 text-black text-xs font-semibold uppercase tracking-wider'>
            Valid JSON
          </span>
        )
      )}
      {!error && <Output value={output} rows={10} />}
    </div>
  );
}

// --- Timestamp ------------------------------------------------------------------

export function TimestampTool() {
  const [now, setNow] = useState(() => Date.now());
  const [input, setInput] = useState('');
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const date = parseTimestamp(input);
  const rows: [string, string][] = date
    ? [
        ['Unix seconds', String(Math.floor(date.getTime() / 1000))],
        ['Unix milliseconds', String(date.getTime())],
        ['ISO 8601 (UTC)', date.toISOString()],
        ['Local time', date.toLocaleString()],
        ['Relative', relativeTime(date, now)],
      ]
    : [];

  return (
    <div className='space-y-5'>
      <div className='grid gap-3 sm:grid-cols-2'>
        <div className='border-2 border-brutal-line bg-brutal-paper p-3 shadow-[2px_2px_0_0_rgb(var(--brutal-shadow))]'>
          <div className='text-xs font-semibold uppercase tracking-wider text-brutal-accent'>
            Now (seconds)
          </div>
          <div className='font-mono text-lg font-semibold tabular-nums'>
            {Math.floor(now / 1000)}
          </div>
        </div>
        <div className='border-2 border-brutal-line bg-brutal-paper p-3 shadow-[2px_2px_0_0_rgb(var(--brutal-shadow))]'>
          <div className='text-xs font-semibold uppercase tracking-wider text-brutal-accent'>
            Now (milliseconds)
          </div>
          <div className='font-mono text-lg font-semibold tabular-nums'>{now}</div>
        </div>
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder='Unix time (seconds or ms) or a date, e.g. 2026-10-28 09:30'
        className={field}
        aria-label='Timestamp or date'
      />
      {input.trim() && !date && <ErrorText>That isn&apos;t a timestamp or date I can read.</ErrorText>}
      {rows.map(([label, value]) => (
        <div key={label} className='space-y-1'>
          <div className='text-xs font-semibold uppercase tracking-wider text-brutal-accent'>
            {label}
          </div>
          <Output value={value} />
        </div>
      ))}
    </div>
  );
}
