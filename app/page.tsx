'use client';
import { useState, useEffect } from 'react';
import {
  EyeIcon,
  EyeSlashIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  ArrowPathIcon,
  LightBulbIcon,
  VariableIcon,
  StopIcon,
  ChatBubbleOvalLeftIcon,
} from '@heroicons/react/24/outline';
import QuoteCard from '@/components/QuoteCard';
// import Clock from '../components/Clock';
import FooterCredit from '@/components/FooterCredit';
import dynamic from 'next/dynamic';
import { randomColor } from '@/lib/helpers';

const Clock = dynamic(() => import('@/components/Clock'), { ssr: false });

export default function Home() {
  const [color, setColor] = useState('#000000');
  const [fullScrren, setFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [crazyMode, setCrazyMode] = useState(false);
  const [crazyModeInterval, setCrazyModeInterval] = useState(500);
  const [showQuote, setShowQuote] = useState(false);
  const [randomQuote, setRandomQuote] = useState({});
  const [fetchRandomQuote, setFetchRandomQuote] = useState(false);
  // const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  // const [isErrorQuote, setIsErrorQuote] = useState(false);

  useEffect(() => {
    if (isIOSDevice()) {
      console.log(
        'Full screen mode is not supported on iOS devices. Please use a desktop browser to use this feature.'
      );
      return;
    }
    if (fullScrren) {
      requestFullScreen();
    } else {
      exitFullscreen();
    }
  }, [fullScrren]);

  const isIOSDevice = () => {
    const platforms = ['iPad', 'iPhone', 'iPod'];
    return platforms.some((platform) => navigator.userAgent.includes(platform));
  };

  useEffect(() => {
    if (crazyMode) {
      const interval = setInterval(() => {
        setColor(randomColor());
        if (showQuote) {
          //TODO: Implement this with context api
          // getRandomQuote();
        }
      }, crazyModeInterval);
      return () => clearInterval(interval);
    }
  }, [crazyMode, crazyModeInterval]);

  const requestFullScreen = () => {
    var elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      // if (document.exitFullscreen) {
      // }
    }
  };

  const randomMode = () => {
    setColor(randomColor());
    if (showQuote) {
      setFetchRandomQuote(true);
    }
  };

  const toggleFullScreen = () => {
    setFullScreen(!fullScrren);
  };

  return (
    <main
      className='h-full w-full min-h-screen p-1 relative'
      style={{ backgroundColor: color }} //{`background-color: ${color}`}
    >
      {showControls ? (
        <div className='flex flex-row items-end justify-end align-middle p-4 flex-wrap space-x-2 space-y-2 bg-black bg-opacity-10 rounded-md mx-1'>
          <Clock />
          <h1 className=' text-white align-middle'>
            <span className='bg-black p-1 bg-opacity-10 rounded-md'>
              {color}
            </span>{' '}
          </h1>
          <LightBulbIcon
            onClick={randomMode}
            // title='Random Color'
            className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
          />

          <ArrowPathIcon
            className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
            onClick={() => setColor('#000000')}
            // title='Black'
          />
          <ChatBubbleOvalLeftIcon
            className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
            onClick={() => setShowQuote(!showQuote)}
            // title='Show Quote'
          />
          {fullScrren ? (
            <ArrowsPointingInIcon
              className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
              onClick={toggleFullScreen}
              // title='Exit Full Screen'
            />
          ) : (
            <ArrowsPointingOutIcon
              className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
              onClick={toggleFullScreen}
              // title='Full Screen'
            />
          )}
          {crazyMode ? (
            <>
              <StopIcon
                className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
                onClick={() => setCrazyMode(!crazyMode)}
                // title='Stop Crazy Mode'
              />
              <input
                type='range'
                min='100'
                max='10000'
                value={crazyModeInterval}
                className='text-white cursor-pointer hover:text-slate-500'
                onChange={(e) =>
                  setCrazyModeInterval(parseInt(e.target?.value))
                }
              />
            </>
          ) : (
            <VariableIcon
              className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
              onClick={() => setCrazyMode(!crazyMode)}
              // title='Crazy Mode'
            />
          )}
          <EyeSlashIcon
            className='h-7 w-7 text-white cursor-pointer hover:text-slate-500'
            onClick={() => setShowControls(!showControls)}
            // title='Hide Controls'
          />
        </div>
      ) : (
        <div className='flex flex-row items-end justify-end p-4  bg-black bg-opacity-10 rounded-md mx-1'>
          <EyeIcon
            className='h-7 w-7 text-slate-700 cursor-pointer hover:text-slate-500'
            onClick={() => setShowControls(!showControls)}
            // title='Show Controls'
          />
        </div>
      )}
      {showQuote && (
        <div className='align-middle items-center justify-center flex min-h-[80vh]'>
          <QuoteCard
            showQuote={showQuote}
            fetchRandomQuote={fetchRandomQuote}
          />
        </div>
      )}
      <FooterCredit />
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
