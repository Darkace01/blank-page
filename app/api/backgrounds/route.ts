import { list } from '@vercel/blob';
import { NextResponse } from 'next/server';

// Lists the collage photos in Vercel Blob (uploaded with
// `yarn upload-backgrounds`). In production the result is cached and refreshed
// hourly, so new uploads appear without a redeploy; if a refresh fails, the
// last good list keeps being served. In dev it runs on every request.
export const revalidate = 3600;

type Picture = {
  src: string;
  author: string;
  link: string;
  width: number;
  height: number;
};

const BLOB_PREFIX = 'backgrounds/';
// The upload script puts each photo's size in its name, e.g.
// backgrounds/20250721_090412-1920x2400.webp; Blob has no custom metadata.
const BLOB_NAME = /^(.+)-(\d+)x(\d+)\.\w+$/;
// Every photo in the store was taken by the app's author.
const PHOTOGRAPHER = 'Kazeem Quadri';

export async function GET() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('BLOB_READ_WRITE_TOKEN is not set; no photos to list.');
    return NextResponse.json([]);
  }

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
        author: PHOTOGRAPHER,
        link: blob.url,
        width: Number(match[2]),
        height: Number(match[3]),
      });
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return NextResponse.json(pictures);
}
