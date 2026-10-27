import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PICTURES_LIST_URL,
  PICTURES_PAGE_COUNT,
  pictureUrl,
  RANDOM_QUOTES_URL,
} from './helpers';

export const QUOTE_QUERY_KEY = ['randomQuote'];
export const PICTURES_QUERY_KEY = ['pictures'];

const fetchQuote = () =>
  axios
    .get(RANDOM_QUOTES_URL)
    .then(({ data }) => ({ content: data.quote, author: data.author }));

export const useQuote = () =>
  useQuery({
    queryKey: QUOTE_QUERY_KEY,
    queryFn: fetchQuote,
  });

const fetchPictures = () => {
  const page = Math.floor(Math.random() * PICTURES_PAGE_COUNT) + 1;
  return axios
    .get(PICTURES_LIST_URL, { params: { page, limit: 100 } })
    .then(({ data }) => data);
};

// Picks random Picsum photos. `next()` preloads the image before swapping it
// in, so the background never flashes blank while a photo downloads.
export const useRandomPicture = (enabled) => {
  const { data: pictures, isError } = useQuery({
    queryKey: PICTURES_QUERY_KEY,
    queryFn: fetchPictures,
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const [picture, setPicture] = useState(
    /** @type {{ author: string, link: string, src: string } | null} */ (null),
  );

  const next = useCallback(() => {
    if (!pictures?.length) return;
    const pick = pictures[Math.floor(Math.random() * pictures.length)];
    const src = pictureUrl(pick.id);
    const img = new Image();
    img.onload = () => setPicture({ author: pick.author, link: pick.url, src });
    img.src = src;
  }, [pictures]);

  useEffect(() => {
    if (enabled && !picture) next();
  }, [enabled, picture, next]);

  return { picture, next, isError };
};
