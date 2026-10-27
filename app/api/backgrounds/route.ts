import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { list } from '@vercel/blob';
import { imageSizeFromFile } from 'image-size/fromFile';
import { NextResponse } from 'next/server';

// Lists the collage photos: from Vercel Blob when BLOB_READ_WRITE_TOKEN is set
// and the store has photos, otherwise from public/backgrounds. (When this
// returns nothing, the client falls back to Picsum.) In production the result
// is cached and refreshed hourly, so new Blob uploads appear without a
// redeploy; in dev it runs on every request.
export const revalidate = 3600;

type Picture = {
  src: string;
  author: string;
  link: string;
  width: number;
  height: number;
};

// --- Vercel Blob (uploaded with `yarn upload-backgrounds`) ---

// Every photo in the Blob store was taken by the app's author.
const BLOB_PHOTOGRAPHER = 'Kazeem Quadri';

const BLOB_PREFIX = 'backgrounds/';
// The upload script puts each photo's size in its name, e.g.
// backgrounds/20250721_090412-1920x2400.webp; Blob has no custom metadata.
const BLOB_NAME = /^(.+)-(\d+)x(\d+)\.\w+$/;

const blobPictures = async (): Promise<Picture[]> => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return [];
  const pictures: Picture[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: BLOB_PREFIX, cursor });
    for (const blob of page.blobs) {
      // Blobs without a size in their name (e.g. uploaded by hand) are skipped.
      const match = blob.pathname.slice(BLOB_PREFIX.length).match(BLOB_NAME);
      if (!match) continue;
      pictures.push({
        src: blob.url,
        author: BLOB_PHOTOGRAPHER,
        link: blob.url,
        width: Number(match[2]),
        height: Number(match[3]),
      });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return pictures;
};

// --- public/backgrounds ---

const BACKGROUNDS_DIR = path.join(process.cwd(), 'public', 'backgrounds');
const IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.gif',
  '.svg',
]);

// Width/height as displayed. EXIF orientations 5-8 are rotated 90 degrees, as
// phone photos often are, so their stored dimensions are swapped.
const displaySize = async (file: string) => {
  const { width, height, orientation } = await imageSizeFromFile(
    path.join(BACKGROUNDS_DIR, file),
  );
  return orientation && orientation >= 5
    ? { width: height, height: width }
    : { width, height };
};

const folderPictures = async (): Promise<Picture[]> => {
  const files = await readdir(BACKGROUNDS_DIR).catch(() => []);
  const images = files.filter((file) =>
    IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()),
  );

  // Files whose size can't be read are unreadable or corrupt; leave them out.
  const pictures = await Promise.all(
    images.map(async (file) => {
      const size = await displaySize(file).catch(() => null);
      if (!size?.width || !size?.height) return null;
      const src = `/backgrounds/${encodeURIComponent(file)}`;
      return { src, author: path.parse(file).name, link: src, ...size };
    }),
  );
  return pictures.filter((picture): picture is Picture => picture !== null);
};

export async function GET() {
  const fromBlob = await blobPictures().catch((error) => {
    console.error('Listing Vercel Blob backgrounds failed:', error);
    return [];
  });
  const pictures = fromBlob.length ? fromBlob : await folderPictures();
  return NextResponse.json(pictures);
}
