import axios from 'axios';
import useSWR from 'swr';
import { RANDOM_QUOTES_BASE_URL } from './helpers';

const fetcher = (url) => axios.get(url).then((res) => res.data);
export const useQuote = (url) => {
  // const { data, error } = useSWR(`${RANDOM_QUOTES_BASE_URL}${url}`, fetcher);
  const { data, error } = axios.get(`${RANDOM_QUOTES_BASE_URL}${url}`);

  return {
    data,
    isLoading: !error && !data,
    isError: error,
  };
};
