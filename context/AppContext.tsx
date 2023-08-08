'use client';
import React, { createContext, useEffect } from 'react';
import { Quote } from '../types';

type AppContextType = {
  crazyMode: boolean;
  setCrazyMode: (crazyMode: boolean) => void;
  showQuotes: boolean;
  setShowQuotes: (showQuotes: boolean) => void;
  randomQuote: Quote;
  setRandomQuote: (randomQuote: Quote) => void;
  color: string;
  setColor: (color: string) => void;
  fullScrren: boolean;
  setFullScreen: (fullScrren: boolean) => void;
  showControls: boolean;
  setShowControls: (showControls: boolean) => void;
  crazyModeInterval: number;
  setCrazyModeInterval: (crazyModeInterval: number) => void;
  fetchRandomQuote: boolean;
  setFetchRandomQuote: (fetchRandomQuote: boolean) => void;
  isLoadingQuote: boolean;
  setIsLoadingQuote: (isLoadingQuote: boolean) => void;
  isErrorQuote: boolean;
  setIsErrorQuote: (isErrorQuote: boolean) => void;
};

const defualtRandomQuote = {
  _id: '',
  content: '',
  author: '',
  tags: [],
  authorSlug: '',
  length: 0,
  dateAdded: '',
  dateModified: '',
} as Quote;
const AppContext = createContext({
  crazyMode: false,
  setCrazyMode: (crazyMode: boolean) => {},
  showQuotes: false,
  setShowQuotes: (showQuotes: boolean) => {},
  randomQuote: defualtRandomQuote,
  setRandomQuote: (randomQuote: Quote) => {},
  color: '#000000',
  setColor: (color: string) => {},
  fullScrren: false,
  setFullScreen: (fullScrren: boolean) => {},
  showControls: true,
  setShowControls: (showControls: boolean) => {},
  crazyModeInterval: 500,
  setCrazyModeInterval: (crazyModeInterval: number) => {},
  fetchRandomQuote: false,
  setFetchRandomQuote: (fetchRandomQuote: boolean) => {},
  isLoadingQuote: false,
  setIsLoadingQuote: (isLoadingQuote: boolean) => {},
  isErrorQuote: false,
  setIsErrorQuote: (isErrorQuote: boolean) => {},
} as AppContextType);

export const AppValuesProvider = ({ children }: any) => {
  const [color, setColor] = React.useState('#000000');
  const [fullScrren, setFullScreen] = React.useState(false);
  const [showControls, setShowControls] = React.useState(true);
  const [crazyMode, setCrazyMode] = React.useState(false);
  const [crazyModeInterval, setCrazyModeInterval] = React.useState(500);
  const [showQuotes, setShowQuotes] = React.useState(false);
  const [randomQuote, setRandomQuote] = React.useState(defualtRandomQuote);
  const [fetchRandomQuote, setFetchRandomQuote] = React.useState(false);
  const [isLoadingQuote, setIsLoadingQuote] = React.useState(false);
  const [isErrorQuote, setIsErrorQuote] = React.useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (crazyMode) {
        setFetchRandomQuote(true);
      }
    }, crazyModeInterval);
    return () => clearInterval(interval);
  }, [crazyMode, crazyModeInterval]);

  useEffect(() => {
    if (fetchRandomQuote) {
      setIsLoadingQuote(true);
      fetch('https://quote-garden.herokuapp.com/api/v2/quotes/random')
        .then((response) => response.json())
        .then((data) => {
          setRandomQuote(data.quote);
          setIsLoadingQuote(false);
          setFetchRandomQuote(false);
        })
        .catch((error) => {
          setIsLoadingQuote(false);
          setIsErrorQuote(true);
          setFetchRandomQuote(false);
        });
    }
  }, [fetchRandomQuote]);

  return (
    <AppContext.Provider
      value={{
        crazyMode,
        setCrazyMode,
        showQuotes,
        setShowQuotes,
        randomQuote,
        setRandomQuote,
        color,
        setColor,
        fullScrren,
        setFullScreen,
        showControls,
        setShowControls,
        crazyModeInterval,
        setCrazyModeInterval,
        fetchRandomQuote,
        setFetchRandomQuote,
        isLoadingQuote,
        setIsLoadingQuote,
        isErrorQuote,
        setIsErrorQuote,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;
