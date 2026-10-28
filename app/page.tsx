'use client';
import { useState, useEffect } from 'react';
import QuoteCard from '@/components/QuoteCard';
import FooterCredit from '@/components/FooterCredit';
import ControlsSheet, { type BgMode } from '@/components/ControlsSheet';
import PictureCollage from '@/components/PictureCollage';
import dynamic from 'next/dynamic';
import {
  DEFAULT_SLIDESHOW_INTERVAL,
  randomColor,
  SLIDESHOW_INTERVALS,
} from '@/lib/helpers';
import { usePersistentState } from '@/lib/usePersistentState';
import { useQueryClient } from '@tanstack/react-query';
import { QUOTE_QUERY_KEY, useRandomCollage } from '@/lib/apiHelpers';

const Clock = dynamic(() => import('@/components/Clock'), { ssr: false });

const isHexColor = (value: unknown) =>
  typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value);

const isIOSDevice = () => {
  const platforms = ['iPad', 'iPhone', 'iPod'];
  return platforms.some((platform) => navigator.userAgent.includes(platform));
};

const requestFullScreen = () => {
  const elem = document.documentElement;
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  }
};

const exitFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
};

export default function Home() {
  // Settings are saved in localStorage and restored after a refresh.
  // Fullscreen isn't: browsers only allow entering it from a user's click.
  const [color, setColor] = usePersistentState('color', '#000000', isHexColor);
  const [fullScrren, setFullScreen] = useState(false);
  const [crazyMode, setCrazyMode] = usePersistentState('crazyMode', false);
  const [crazyModeInterval, setCrazyModeInterval] = usePersistentState(
    'crazyModeInterval',
    500,
    (value) => typeof value === 'number' && value >= 100 && value <= 10000,
  );
  const [showQuote, setShowQuote] = usePersistentState('showQuote', false);
  const [showClock, setShowClock] = usePersistentState('showClock', true);
  const [bgMode, setBgMode] = usePersistentState<BgMode>(
    'bgMode',
    'color',
    (value) => value === 'color' || value === 'picture',
  );
  const [autoChange, setAutoChange] = usePersistentState('autoChange', true);
  const [changeInterval, setChangeInterval] = usePersistentState(
    'changeInterval',
    DEFAULT_SLIDESHOW_INTERVAL,
    (value) => SLIDESHOW_INTERVALS.includes(value as number),
  );
  // Bumped on a manual shuffle, to restart the slideshow countdown.
  const [shuffleCount, setShuffleCount] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const queryClient = useQueryClient();
  const {
    collage,
    next: nextPicture,
    isError: isPictureError,
  } = useRandomCollage(bgMode === 'picture');

  useEffect(() => {
    if (isIOSDevice()) {
      console.log(
        'Full screen mode is not supported on iOS devices. Please use a desktop browser to use this feature.',
      );
      return;
    }
    if (fullScrren) {
      requestFullScreen();
    } else {
      exitFullscreen();
    }
  }, [fullScrren]);

  // Keep the toggle in sync when fullscreen is left another way (e.g. Esc).
  useEffect(() => {
    const sync = () => setFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  // Crazy mode cycles colours; pictures have their own slideshow below.
  useEffect(() => {
    if (crazyMode && bgMode === 'color') {
      const interval = setInterval(() => {
        setColor(randomColor());
      }, crazyModeInterval);
      return () => clearInterval(interval);
    }
  }, [crazyMode, crazyModeInterval, bgMode, setColor]);

  // Picture slideshow. Paused while a photo is open in the lightbox.
  // biome-ignore lint/correctness/useExhaustiveDependencies: shuffleCount restarts the countdown after a manual shuffle
  useEffect(() => {
    if (bgMode === 'picture' && autoChange && !lightboxOpen) {
      const interval = setInterval(nextPicture, changeInterval);
      return () => clearInterval(interval);
    }
  }, [bgMode, autoChange, changeInterval, lightboxOpen, nextPicture, shuffleCount]);

  const refreshQuote = () => {
    if (showQuote) {
      queryClient.refetchQueries({ queryKey: QUOTE_QUERY_KEY });
    }
  };

  const pictureStatus = isPictureError
    ? "Couldn't load pictures."
    : collage
      ? `Showing ${collage.tiles.length} photos.`
      : 'Loading pictures...';

  return (
    <main
      className='h-full w-full min-h-screen p-1 relative'
      style={{ backgroundColor: color }}
    >
      {bgMode === 'picture' && (
        <PictureCollage
          collage={collage}
          isError={isPictureError}
          onLightboxOpenChange={setLightboxOpen}
        />
      )}
      {showClock && (
        <div className='pointer-events-none fixed right-16 top-[1.125rem] z-20'>
          <Clock />
        </div>
      )}
      <ControlsSheet
        bgMode={bgMode}
        onBgModeChange={setBgMode}
        color={color}
        onColorChange={setColor}
        onRandomColor={() => {
          setColor(randomColor());
          refreshQuote();
        }}
        onBlack={() => setColor('#000000')}
        crazyMode={crazyMode}
        onCrazyModeChange={setCrazyMode}
        crazyModeInterval={crazyModeInterval}
        onCrazyModeIntervalChange={setCrazyModeInterval}
        pictureStatus={pictureStatus}
        onShufflePictures={() => {
          nextPicture();
          setShuffleCount((count) => count + 1);
          refreshQuote();
        }}
        autoChange={autoChange}
        onAutoChangeChange={setAutoChange}
        changeInterval={changeInterval}
        onChangeIntervalChange={setChangeInterval}
        showClock={showClock}
        onShowClockChange={setShowClock}
        showQuote={showQuote}
        onShowQuoteChange={setShowQuote}
        fullScreen={fullScrren}
        onFullScreenChange={setFullScreen}
      />
      {showQuote && (
        <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4'>
          <QuoteCard />
        </div>
      )}
      {/* In picture mode the corner belongs to a photo's lightbox button; the
          credit is in the controls sheet instead. */}
      {bgMode === 'color' && <FooterCredit />}
    </main>
  );
}

// export async function getStaticProps() {
//   const res = await axios.get(RANDOM_QUOTES_URL);
//   const { content, author } = res.data;

//   return {
//     props: {
//       content,
//       author,
//     }, // will be passed to the page component as props
//   };
// }
// export default Home;
