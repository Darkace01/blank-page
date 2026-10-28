// Builds Blank Page as a browser extension for Chrome and Firefox:
//
//   yarn build:extension
//
// It runs a static export of the app (`NEXT_PUBLIC_EXTENSION=1`, see
// next.config.js), makes it acceptable to Manifest V3, and writes
// dist/chrome/ and dist/firefox/ (load these unpacked) plus a .zip of each
// for the stores.
//
// Two things in a Next.js export break extensions, and are fixed here:
// - Chrome refuses files and folders whose names start with `_`, so `_next/`
//   is renamed `next/` (and every reference to it rewritten), and anything
//   else starting with `_` is dropped (route prefetch files; there's only one
//   page, so nothing navigates).
// - Manifest V3's content security policy blocks inline scripts, and Next
//   inlines its bootstrap data. Each inline script is moved to its own file and
//   loaded from the same spot, so it still runs in the same order.

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, sep } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';
import sharp from 'sharp';

const ROOT = join(import.meta.dirname, '..');
// With `output: 'export'`, the export lands in `distDir` (next.config.js).
const OUT = join(ROOT, '.next-extension');
const DIST = join(ROOT, 'dist');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

const NAME = 'Blank Page';
const DESCRIPTION =
  'Fill a screen with a solid colour or a photo slideshow, with a focus timer, ambient noise and a developer toolkit.';
// Firefox needs a fixed add-on ID.
const GECKO_ID = 'blank-page@darkace01';

// Sorted, so the zips come out byte-for-byte the same on every machine.
const walk = (dir) =>
  readdirSync(dir)
    .sort()
    .flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? walk(path) : [path];
    });

// 1. Static export.
rmSync(OUT, { recursive: true, force: true });
execSync('yarn next build', {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_EXTENSION: '1' },
});

// 2. `_next/` -> `next/`, and drop everything else starting with `_`.
renameSync(join(OUT, '_next'), join(OUT, 'next'));
for (const name of readdirSync(OUT)) {
  if (name.startsWith('_')) rmSync(join(OUT, name), { recursive: true });
}
for (const file of walk(OUT)) {
  if (
    relative(OUT, file)
      .split(sep)
      .some((part) => part.startsWith('_'))
  ) {
    rmSync(file);
  }
}
for (const file of walk(OUT)) {
  if (!/\.(html|js|css|txt|json)$/.test(file)) continue;
  const text = readFileSync(file, 'utf8');
  const rewritten = text.replaceAll('/_next/', '/next/');
  if (rewritten !== text) writeFileSync(file, rewritten);
}

// 3. Inline scripts -> files. JSON data blocks (any `type` other than a
// JavaScript one) aren't run, so they can stay inline.
const INLINE_DIR = join(OUT, 'next', 'inline');
mkdirSync(INLINE_DIR, { recursive: true });
const INLINE_SCRIPT = /<script((?:\s[^>]*)?)>([\s\S]*?)<\/script>/g;
for (const file of walk(OUT).filter((f) => f.endsWith('.html'))) {
  const html = readFileSync(file, 'utf8').replace(
    INLINE_SCRIPT,
    (tag, attrs, code) => {
      if (!code.trim() || /\ssrc=/.test(attrs)) return tag;
      const type = attrs.match(/\stype="([^"]*)"/)?.[1];
      if (type && !/^(text|application)\/javascript$|^module$/.test(type)) {
        return tag;
      }
      const hash = createHash('sha256').update(code).digest('hex').slice(0, 16);
      writeFileSync(join(INLINE_DIR, `${hash}.js`), code);
      const kept = attrs.replace(/\snonce="[^"]*"/, '');
      return `<script${kept} src="/next/inline/${hash}.js"></script>`;
    },
  );
  writeFileSync(file, html);
}

// Anything that still mentions `_next` would 404 in the extension.
const leftovers = walk(OUT).filter(
  (f) =>
    /\.(html|js|css)$/.test(f) && readFileSync(f, 'utf8').includes('/_next/'),
);
if (leftovers.length) {
  throw new Error(`Still referencing /_next/: ${leftovers.join(', ')}`);
}

// 4. Icons: a white page with a folded corner on indigo.
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" rx="24" fill="#4f46e5"/>
  <path d="M36 20h40l20 20v68H36z" fill="#fff"/>
  <path d="M76 20v20h20z" fill="#c7d2fe"/>
</svg>`;
const ICON_SIZES = [16, 32, 48, 128];
mkdirSync(join(OUT, 'icons'), { recursive: true });
for (const size of ICON_SIZES) {
  await sharp(Buffer.from(ICON_SVG))
    .resize(size, size)
    .png()
    .toFile(join(OUT, 'icons', `${size}.png`));
}
const icons = Object.fromEntries(
  ICON_SIZES.map((size) => [size, `icons/${size}.png`]),
);
cpSync(join(ROOT, 'extension', 'background.js'), join(OUT, 'background.js'));

// 5. Manifests. They differ only in the background script: Chrome runs a
// service worker, Firefox an event page.
const baseManifest = {
  manifest_version: 3,
  name: NAME,
  description: DESCRIPTION,
  version: pkg.version,
  icons,
  action: { default_title: 'Open Blank Page', default_icon: icons },
  chrome_url_overrides: { newtab: 'index.html' },
};
const manifests = {
  chrome: {
    ...baseManifest,
    background: { service_worker: 'background.js' },
  },
  firefox: {
    ...baseManifest,
    background: { scripts: ['background.js'] },
    browser_specific_settings: {
      gecko: {
        id: GECKO_ID,
        // The first version that reads `data_collection_permissions`.
        strict_min_version: '140.0',
        data_collection_permissions: { required: ['none'] },
      },
    },
  },
};

rmSync(DIST, { recursive: true, force: true });
for (const [browser, manifest] of Object.entries(manifests)) {
  const dir = join(DIST, browser);
  cpSync(OUT, dir, { recursive: true });
  writeFileSync(
    join(dir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  writeFileSync(join(DIST, `blank-page-${browser}.zip`), zip(dir));
}

console.log(
  `\nExtension built in ${relative(ROOT, DIST)}${sep}: chrome/ and firefox/ (load unpacked), and a .zip of each.`,
);

// A minimal .zip writer (deflate, forward-slash paths as the stores expect),
// so there's no extra dependency.
function zip(dir) {
  const files = [];
  const central = [];
  let offset = 0;
  for (const file of walk(dir)) {
    const name = Buffer.from(relative(dir, file).split(sep).join('/'));
    const data = readFileSync(file);
    const packed = deflateRawSync(data);
    const crc = crc32(data);
    const header = (signature, extra) => {
      const b = Buffer.alloc(extra ? 46 : 30);
      let i = 0;
      b.writeUInt32LE(signature, i);
      i += 4;
      if (extra) {
        b.writeUInt16LE(20, i); // version made by
        i += 2;
      }
      b.writeUInt16LE(20, i); // version needed
      b.writeUInt16LE(0x0800, i + 2); // UTF-8 names
      b.writeUInt16LE(8, i + 4); // deflate
      b.writeUInt32LE(0x00210000, i + 6); // 1980-01-01 00:00
      b.writeUInt32LE(crc, i + 10);
      b.writeUInt32LE(packed.length, i + 14);
      b.writeUInt32LE(data.length, i + 18);
      b.writeUInt16LE(name.length, i + 22);
      if (extra) b.writeUInt32LE(offset, i + 36);
      return b;
    };
    const local = header(0x04034b50, false);
    files.push(local, name, packed);
    central.push(header(0x02014b50, true), name);
    offset += local.length + name.length + packed.length;
  }
  const centralSize = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(central.length / 2, 8);
  end.writeUInt16LE(central.length / 2, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, ...central, end]);
}
