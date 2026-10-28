'use client';
import { useState, useEffect } from 'react';
import QuoteCard from '@/components/QuoteCard';
import FooterCredit from '@/components/FooterCredit';
import ControlsSheet from '@/components/ControlsSheet';
import PictureCollage from '@/components/PictureCollage';
import DevToolkit from '@/components/devtools/DevToolkit';
import BreathingGuide from '@/components/widgets/BreathingGuide';
import FocusTimer from '@/components/widgets/FocusTimer';
import ScreenFilters from '@/components/widgets/ScreenFilters';
import dynamic from 'next/dynamic';
import { randomColor } from '@/lib/helpers';
import { SettingsProvider, useSettingsState } from '@/lib/settings';
import { useAmbientNoise } from '@/lib/useAmbientNoise';
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

// Keyboard shortcuts are ignored while typing, using a slider or select, or
// inside a dialog (the controls sheet, lightbox or toolkit).
const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="combobox"], [role="slider"], [role="dialog"]',
    ),
  );

export default function Home() {
  const settings = useSettingsState();
  const {
    advanced,
    color,
    setColor,
    showClock,
    crazyMode,
    crazyModeInterval,
    autoChange,
    changeInterval,
  } = settings;
  // Basic mode is a plain colour screen: advanced features stay off (their
  // settings are kept for when advanced mode is switched back on).
  const bgMode = advanced ? settings.bgMode : 'color';
  const showQuote = advanced && settings.showQuote;
  const showTimer = advanced && settings.showTimer;
  const showBreathing = advanced && settings.showBreathing;
  const ambientSound = advanced ? settings.ambientSound : 'off';
  const dim = advanced ? settings.dim : 0;
  const warmLight = advanced && settings.warmLight;

  const [fullScrren, setFullScreen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  // Hides the clock and widgets (H); not saved, so a refresh brings them back.
  const [uiHidden, setUiHidden] = useState(false);
  // Bumped on a manual shuffle, to restart the slideshow countdown.
  const [shuffleCount, setShuffleCount] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const queryClient = useQueryClient();
  const {
    collage,
    next: nextPicture,
    isError: isPictureError,
  } = useRandomCollage(bgMode === 'picture');

  useAmbientNoise(ambientSound, settings.ambientVolume);

  // Advanced mode's dark theme: `.night` on <html> (so the sheet, dialogs and
  // select menus, which render in portals, pick it up too) swaps the brutal-*
  // colours in app/globals.css. 'system' follows the device and its changes.
  const { theme } = settings;
  useEffect(() => {
    const root = document.documentElement;
    if (!advanced) {
      root.classList.remove('night');
      return;
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () =>
      root.classList.toggle(
        'night',
        theme === 'dark' || (theme === 'system' && media.matches),
      );
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [advanced, theme]);

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
    if (advanced && crazyMode && bgMode === 'color') {
      const interval = setInterval(() => {
        setColor(randomColor());
      }, crazyModeInterval);
      return () => clearInterval(interval);
    }
  }, [advanced, crazyMode, crazyModeInterval, bgMode, setColor]);

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

  const randomizeColor = () => {
    setColor(randomColor());
    refreshQuote();
  };

  const shufflePictures = () => {
    nextPicture();
    setShuffleCount((count) => count + 1);
    refreshQuote();
  };

  const openDevTools = () => {
    setControlsOpen(false);
    setDevToolsOpen(true);
  };

  // Keyboard shortcuts (listed in the advanced panel). No dependency list: it's
  // re-bound each render so the handlers always see current state.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      switch (event.key.toLowerCase()) {
        case ' ':
          // Space on a focused button already clicks it.
          if (event.target instanceof HTMLButtonElement) return;
          event.preventDefault();
          if (bgMode === 'picture') shufflePictures();
          else randomizeColor();
          break;
        case 'f':
          setFullScreen((on) => !on);
          break;
        case 'b':
          setColor('#000000');
          break;
        case 'h':
          setUiHidden((hidden) => !hidden);
          break;
        case 'd':
          if (advanced) openDevTools();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const pictureStatus = isPictureError
    ? "Couldn't load pictures."
    : collage
      ? `Showing ${collage.tiles.length} photos.`
      : 'Loading pictures...';

  return (
    <SettingsProvider value={settings}>
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
        {showQuote && !uiHidden && (
          <div className='pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4'>
            <QuoteCard />
          </div>
        )}
        <ScreenFilters dim={dim} warm={warmLight} />
        {showClock && !uiHidden && (
          <div className='pointer-events-none fixed right-16 top-[1.125rem] z-20'>
            <Clock />
          </div>
        )}
        {showTimer && !uiHidden && (
          // Below the clock and controls button on phones, where they'd overlap.
          <div className='fixed left-3 top-16 z-20 sm:top-3'>
            <FocusTimer workMinutes={settings.timerMinutes} />
          </div>
        )}
        {showBreathing && !uiHidden && (
          <div className='fixed bottom-4 left-1/2 z-20 -translate-x-1/2'>
            <BreathingGuide />
          </div>
        )}
        <ControlsSheet
          open={controlsOpen}
          onOpenChange={setControlsOpen}
          pictureStatus={pictureStatus}
          onRandomColor={randomizeColor}
          onShufflePictures={shufflePictures}
          onOpenDevTools={openDevTools}
          fullScreen={fullScrren}
          onFullScreenChange={setFullScreen}
        />
        {advanced && (
          <DevToolkit open={devToolsOpen} onOpenChange={setDevToolsOpen} />
        )}
        {/* In picture mode the corner belongs to a photo's lightbox button; the
            credit is in the controls sheet instead. */}
        {bgMode === 'color' && <FooterCredit />}
      </main>
    </SettingsProvider>
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
