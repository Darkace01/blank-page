import axios from 'axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buildCollage } from './collage';
import {
  collageBox,
  LOCAL_PICTURES_URL,
  PICTURES_LIST_URL,
  PICTURES_PAGE_COUNT,
  pictureUrl,
  RANDOM_QUOTES_URL,
} from './helpers';

export const QUOTE_QUERY_KEY = ['randomQuote'];
export const LOCAL_PICTURES_QUERY_KEY = ['localPictures'];
export const PICSUM_PICTURES_QUERY_KEY = ['picsumPictures'];

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

// Local items carry a ready `src`; Picsum items an `id` whose URL is sized to
// its tile when the collage is laid out. Both carry `width` and `height`.
const fetchLocalPictures = () =>
  axios
    .get(LOCAL_PICTURES_URL)
    .then(({ data }) => data)
    .catch(() => []);

const fetchPicsumPictures = async () => {
  const page = Math.floor(Math.random() * PICTURES_PAGE_COUNT) + 1;
  const { data } = await axios.get(PICTURES_LIST_URL, {
    params: { page, limit: 100 },
  });
  return data.map(({ id, author, url, width, height }) => ({
    id,
    author,
    link: url,
    width,
    height,
  }));
};

const pictureKey = (p) => p.src ?? p.id;

const preload = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = src;
  });

let collageCount = 0;

// Builds random photo collages: from public/backgrounds when it has photos
// that load, otherwise from Picsum. A collage with images that fail to load is
// thrown away, the broken images are dropped and another is built, so broken
// local files fall through to Picsum. `next()` preloads every tile before
// swapping the collage in, so it never appears half-loaded.
export const useRandomCollage = (enabled) => {
  const [failed, setFailed] = useState(() => new Set());
  const [retry, setRetry] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [collage, setCollage] = useState(
    /** @type {import('../components/PictureCollage').Collage | null} */ (null),
  );
  const shownKeys = useRef(new Set());
  const failureCount = useRef(0);

  const local = useQuery({
    queryKey: LOCAL_PICTURES_QUERY_KEY,
    queryFn: fetchLocalPictures,
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const usableLocal = useMemo(
    () => (local.data ?? []).filter((p) => !failed.has(pictureKey(p))),
    [local.data, failed],
  );
  const useLocal = usableLocal.length > 0;
  const picsum = useQuery({
    queryKey: PICSUM_PICTURES_QUERY_KEY,
    queryFn: fetchPicsumPictures,
    enabled: enabled && local.isSuccess && !useLocal,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const pictures = useMemo(
    () =>
      useLocal
        ? usableLocal
        : (picsum.data ?? []).filter((p) => !failed.has(pictureKey(p))),
    [useLocal, usableLocal, picsum.data, failed],
  );

  const next = useCallback(() => {
    if (!pictures.length || gaveUp) return;
    // Prefer photos that weren't in the last collage, when there are enough.
    const fresh = pictures.filter((p) => !shownKeys.current.has(pictureKey(p)));
    const pool = fresh.length >= MIN_FRESH_PICTURES ? fresh : pictures;

    const box = collageBox();
    const tiles = buildCollage(pool, box.width, box.height).map((tile) => ({
      ...tile,
      src: tile.src ?? pictureUrl(tile.id, tile.pxWidth, tile.pxHeight),
    }));

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
            for (const tile of broken) nextFailed.add(pictureKey(tile));
            return nextFailed;
          });
          setRetry(true);
          return;
        }
        failureCount.current = 0;
        shownKeys.current = new Set(tiles.map(pictureKey));
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
  // images are out of the pool (falling back to Picsum if nothing local is left).
  useEffect(() => {
    if (enabled && (!collage || retry)) {
      setRetry(false);
      next();
    }
  }, [enabled, collage, retry, next]);

  return { collage, next, isError: picsum.isError || gaveUp };
};
