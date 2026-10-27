import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { RANDOM_QUOTES_URL } from './helpers';

export const QUOTE_QUERY_KEY = ['randomQuote'];

const fetchQuote = () =>
  axios
    .get(RANDOM_QUOTES_URL)
    .then(({ data }) => ({ content: data.quote, author: data.author }));

export const useQuote = () =>
  useQuery({
    queryKey: QUOTE_QUERY_KEY,
    queryFn: fetchQuote,
  });
