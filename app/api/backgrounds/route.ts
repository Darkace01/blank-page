import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { imageSizeFromFile } from 'image-size/fromFile';
import { NextResponse } from 'next/server';

// Built once at build time in production, like the files in public/ themselves.
// In dev it runs on every request, so new photos show up after a page refresh.
export const dynamic = 'force-static';

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

export async function GET() {
  const files = await readdir(BACKGROUNDS_DIR).catch(() => []);
  const images = files.filter((file) =>
    IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()),
  );

  // Files whose size can't be read are unreadable or corrupt; leave them out.
  const pictures = (
    await Promise.all(
      images.map(async (file) => {
        const size = await displaySize(file).catch(() => null);
        if (!size?.width || !size?.height) return null;
        const src = `/backgrounds/${encodeURIComponent(file)}`;
        return { src, author: path.parse(file).name, link: src, ...size };
      }),
    )
  ).filter(Boolean);

  return NextResponse.json(pictures);
}
