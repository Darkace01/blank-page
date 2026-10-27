// Resizes the photos in a folder and uploads them to Vercel Blob for the
// picture collage. Originals are left untouched.
//
//   yarn upload-backgrounds "<folder of photos>"
//
// Needs BLOB_READ_WRITE_TOKEN (loaded from .env.local by the package script).
// Each photo is rotated upright, shrunk to MAX_SIDE on its longest side and
// saved as WebP under backgrounds/<name>-<width>x<height>.webp. The size lives
// in the name because Blob has no custom metadata, and the collage needs it to
// lay photos out before downloading them. Photos already uploaded (same name)
// are skipped, so the script can be re-run after adding more.

import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { list, put } from '@vercel/blob';
import sharp from 'sharp';

const MAX_SIDE = 2400;
const QUALITY = 80;
const PREFIX = 'backgrounds/';
const CONCURRENCY = 4;
const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.tif',
  '.tiff',
  '.heic',
]);

const sourceDir = process.argv[2];
if (!sourceDir) {
  console.error('Usage: yarn upload-backgrounds "<folder of photos>"');
  process.exit(1);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error('BLOB_READ_WRITE_TOKEN is not set (expected in .env.local).');
  process.exit(1);
}

// "20260831_170820 (1).webp" -> "20260831_170820-1"
const slug = (file) =>
  path
    .parse(file)
    .name.toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

const existingNames = async () => {
  const names = new Set();
  let cursor;
  do {
    const page = await list({ prefix: PREFIX, cursor });
    for (const blob of page.blobs) {
      const match = blob.pathname
        .slice(PREFIX.length)
        .match(/^(.*)-\d+x\d+\.\w+$/);
      if (match) names.add(match[1]);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return names;
};

const files = (await readdir(sourceDir)).filter((file) =>
  IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()),
);
const uploaded = await existingNames();
const todo = files.filter((file) => !uploaded.has(slug(file)));
console.log(
  `${files.length} photos found, ${files.length - todo.length} already uploaded, ${todo.length} to upload.`,
);

let done = 0;
let bytesIn = 0;
let bytesOut = 0;
const failures = [];

const upload = async (file) => {
  const source = path.join(sourceDir, file);
  const image = sharp(source).rotate().resize({
    width: MAX_SIDE,
    height: MAX_SIDE,
    fit: 'inside',
    withoutEnlargement: true,
  });
  const { data, info } = await image
    .webp({ quality: QUALITY })
    .toBuffer({ resolveWithObject: true });
  const { size } = await stat(source);
  const pathname = `${PREFIX}${slug(file)}-${info.width}x${info.height}.webp`;
  await put(pathname, data, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'image/webp',
    // Names include the size and never change, so browsers can cache forever.
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });
  done += 1;
  bytesIn += size;
  bytesOut += data.length;
  console.log(
    `[${done}/${todo.length}] ${file} -> ${pathname} (${(data.length / 1024).toFixed(0)} KB)`,
  );
};

// A failure on the first photo (e.g. a private store, bad token) stops the run
// before anything else is attempted.
if (todo.length) {
  await upload(todo[0]);
}
const queue = todo.slice(1);
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const file = queue.shift();
      try {
        await upload(file);
      } catch (error) {
        failures.push(file);
        console.error(`Failed: ${file}: ${error.message}`);
      }
    }
  }),
);

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(1);
console.log(
  `Uploaded ${done} photos: ${mb(bytesIn)} MB of originals -> ${mb(bytesOut)} MB.`,
);
if (failures.length) {
  console.error(`${failures.length} failed; re-run to retry them.`);
  process.exit(1);
}
