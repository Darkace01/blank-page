'use client';
import { useState, useEffect } from 'react';
import QuoteCard from '@/components/QuoteCard';
import FooterCredit from '@/components/FooterCredit';
import ControlsSheet, { type BgMode } from '@/components/ControlsSheet';
import PictureCollage from '@/components/PictureCollage';
import dynamic from 'next/dynamic';
import { DEFAULT_SLIDESHOW_INTERVAL, randomColor } from '@/lib/helpers';
import { useQueryClient } from '@tanstack/react-query';
import { QUOTE_QUERY_KEY, useRandomCollage } from '@/lib/apiHelpers';

const Clock = dynamic(() => import('@/components/Clock'), { ssr: false });

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
  const [color, setColor] = useState('#000000');
  const [fullScrren, setFullScreen] = useState(false);
  const [crazyMode, setCrazyMode] = useState(false);
  const [crazyModeInterval, setCrazyModeInterval] = useState(500);
  const [showQuote, setShowQuote] = useState(false);
  const [showClock, setShowClock] = useState(true);
  const [bgMode, setBgMode] = useState<BgMode>('color');
  const [autoChange, setAutoChange] = useState(true);
  const [changeInterval, setChangeInterval] = useState(
    DEFAULT_SLIDESHOW_INTERVAL,
  );
  // Bumped on a manual shuffle, to restart the slideshow countdown.
  const [shuffleCount, setShuffleCount] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const queryClient = useQueryClient();
  const {
    collage,
    next: nextPicture,
    isError: isPictureError,
    isOwnPhotos,
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
  }, [crazyMode, crazyModeInterval, bgMode]);

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
        // Only claim authorship once the app's own photos are in use, not
        // before they load or during the Picsum fallback.
        photoCredit={
          collage
            ? isOwnPhotos
              ? 'All photos taken by Kazeem Quadri.'
              : 'Photos by Unsplash photographers, via Lorem Picsum.'
            : null
        }
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
