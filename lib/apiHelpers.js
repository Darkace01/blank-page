import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildCollage } from './collage';
import { collageBox, PICTURES_URL, RANDOM_QUOTES_URL } from './helpers';

export const QUOTE_QUERY_KEY = ['randomQuote'];
export const PICTURES_QUERY_KEY = ['pictures'];

// Consecutive failed collages before giving up (e.g. when offline).
const MAX_PICTURE_FAILURES = 5;
// Below this many fresh photos, the last collage's photos may be reused.
const MIN_FRESH_PICTURES = 6;
const TRANSITIONS = ['rise', 'zoom', 'slide'];

const fetchQuote = () =>
  axios
    .get(RANDOM_QUOTES_URL)
    .then(({ data }) => ({ content: data.quote, author: data.author }));

export const useQuote = () =>
  useQuery({
    queryKey: QUOTE_QUERY_KEY,
    queryFn: fetchQuote,
  });

// The photos in Vercel Blob: `{ src, author, link, width, height }`.
const fetchPictures = () => axios.get(PICTURES_URL).then(({ data }) => data);

const preload = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });

let collageCount = 0;

// Builds random photo collages from the photos in Vercel Blob. A collage with
// photos that fail to load is thrown away, the broken photos are dropped and
// another is built. `next()` preloads every tile before swapping the collage
// in, so it never appears half-loaded.
export const useRandomCollage = (enabled) => {
  const [failed, setFailed] = useState(() => new Set());
  const [retry, setRetry] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [collage, setCollage] = useState(
    /** @type {import('../components/PictureCollage').Collage | null} */ (null),
  );
  const shownSrcs = useRef(new Set());
  const failureCount = useRef(0);

  const query = useQuery({
    queryKey: PICTURES_QUERY_KEY,
    queryFn: fetchPictures,
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const pictures = useMemo(
    () => (query.data ?? []).filter((p) => !failed.has(p.src)),
    [query.data, failed],
  );

  const next = useCallback(() => {
    if (!pictures.length || gaveUp) return;
    // Prefer photos that weren't in the last collage, when there are enough.
    const fresh = pictures.filter((p) => !shownSrcs.current.has(p.src));
    const pool = fresh.length >= MIN_FRESH_PICTURES ? fresh : pictures;

    const box = collageBox();
    const tiles = buildCollage(pool, box.width, box.height);

    Promise.allSettled(tiles.map((tile) => preload(tile.src))).then(
      (results) => {
        const broken = tiles.filter((_, i) => results[i].status === 'rejected');
        if (broken.length) {
          failureCount.current += 1;
          if (failureCount.current >= MAX_PICTURE_FAILURES) {
            setGaveUp(true);
            return;
          }
          setFailed((prev) => {
            const nextFailed = new Set(prev);
            for (const tile of broken) nextFailed.add(tile.src);
            return nextFailed;
          });
          setRetry(true);
          return;
        }
        failureCount.current = 0;
        shownSrcs.current = new Set(tiles.map((tile) => tile.src));
        collageCount += 1;
        setCollage({
          id: collageCount,
          boxWidth: box.width,
          boxHeight: box.height,
          transition:
            TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)],
          tiles,
        });
      },
    );
  }, [pictures, gaveUp]);

  // Build the first collage, and retry after a failed one once the broken
  // photos are out of the pool.
  useEffect(() => {
    if (enabled && (!collage || retry)) {
      setRetry(false);
      next();
    }
  }, [enabled, collage, retry, next]);

  // An error too when the store is empty or every photo in it failed to load.
  const isError =
    query.isError || gaveUp || (query.isSuccess && pictures.length === 0);
  return { collage, next, isError };
};
