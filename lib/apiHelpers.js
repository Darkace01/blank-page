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
// Entry animations (keyframes in app/globals.css). Collages bring tiles in one
// after another; gallery photos change as a whole.
const TRANSITIONS = ['rise', 'zoom', 'slide'];
const GALLERY_TRANSITIONS = [
  'fade',
  'kenburns',
  'slide',
  'zoom',
  'blur',
  'flip',
];

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

// A random entry from `list` that isn't `previous`, so consecutive changes
// never repeat a transition.
const pickDifferent = (list, previous) => {
  const choices = list.filter((item) => item !== previous);
  return choices[Math.floor(Math.random() * choices.length)];
};

// Builds random photo collages from the photos in Vercel Blob: in 'collage'
// layout, `photoCount` photos (0 = auto, up to 6); in 'gallery' layout, one
// photo at a time filling the whole box. A collage with photos that fail to
// load is thrown away, the broken photos are dropped and another is built.
// `next()` preloads every tile before swapping the collage in, so it never
// appears half-loaded. Changing the layout or count builds a new one at once.
export const useRandomCollage = (
  enabled,
  { layout = 'collage', photoCount = 0 } = {},
) => {
  const [failed, setFailed] = useState(() => new Set());
  const [retry, setRetry] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [collage, setCollage] = useState(
    /** @type {import('../components/PictureCollage').Collage | null} */ (null),
  );
  const shownSrcs = useRef(new Set());
  const failureCount = useRef(0);
  const lastTransition = useRef(null);

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
    const gallery = layout === 'gallery';
    // Prefer photos that weren't on screen last time, when there are enough.
    const fresh = pictures.filter((p) => !shownSrcs.current.has(p.src));
    const pool =
      fresh.length >= (gallery ? 1 : MIN_FRESH_PICTURES) ? fresh : pictures;

    const box = collageBox();
    const tiles = gallery
      ? [
          {
            ...pool[Math.floor(Math.random() * pool.length)],
            left: 0,
            top: 0,
            width: 100,
            height: 100,
          },
        ]
      : buildCollage(pool, box.width, box.height, photoCount);
    const transition = pickDifferent(
      gallery ? GALLERY_TRANSITIONS : TRANSITIONS,
      lastTransition.current,
    );

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
        lastTransition.current = transition;
        collageCount += 1;
        setCollage({
          id: collageCount,
          layout,
          boxWidth: box.width,
          boxHeight: box.height,
          transition,
          tiles,
        });
      },
    );
  }, [pictures, gaveUp, layout, photoCount]);

  // A new layout or photo count takes effect straight away.
  const optionsKey = `${layout}-${photoCount}`;
  const lastOptionsKey = useRef(optionsKey);
  useEffect(() => {
    if (optionsKey === lastOptionsKey.current) return;
    lastOptionsKey.current = optionsKey;
    if (enabled) next();
  }, [optionsKey, enabled, next]);

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
